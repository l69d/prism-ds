"use client";

import { Basic, Advanced, MoreDepth } from "@/components/content/tiered";
import { Callout } from "@/components/content/callout";
import { KeyIdea } from "@/components/content/key-idea";
import { M, MB } from "@/components/content/math";
import { CodeBlock } from "@/components/content/code-block";
import { Quiz } from "@/components/content/quiz";

export default function Lesson() {
  return (
    <>
      <p>A convolutional network learns small reusable filters and slides them across an image, so the same edge or texture detector fires no matter where the pattern appears.</p>

      <KeyIdea>Instead of one giant weight per pixel, a CNN learns a tiny filter and shares it across every location. This weight sharing slashes parameters and bakes in the prior that a cat is a cat whether it sits top-left or bottom-right.</KeyIdea>

      <h2>From dense layers to filters</h2>
      <p>A fully connected layer on a 224&times;224 image needs a separate weight for every pixel-to-neuron pair &mdash; tens of millions of parameters that all must be relearned if the object simply shifts. Convolution fixes this with two structural priors:</p>
      <ul>
        <li><strong>Locality:</strong> each output looks only at a small patch (the receptive field), since nearby pixels carry most of the signal.</li>
        <li><strong>Weight sharing:</strong> the same filter is reused at every position, giving <strong>translation equivariance</strong> &mdash; shift the input, and the feature map shifts the same way.</li>
      </ul>
      <p>Stacking layers grows the receptive field: early filters catch edges, deeper ones compose them into shapes, parts, and finally objects.</p>

      <Basic>
        <p>Think of a single rubber stamp you drag across a photo. At each spot the stamp asks one question &mdash; &quot;is there a vertical edge here?&quot; &mdash; and presses a brightness mark on a fresh sheet. Because it&apos;s the <strong>same stamp everywhere</strong>, it finds vertical edges anywhere in the picture for free. A CNN just learns a stack of these stamps and lets later layers combine simple answers (&quot;edge here, corner there&quot;) into rich ones (&quot;this looks like an eye&quot;).</p>
      </Basic>

      <Advanced>
        <p>A 2D convolution (technically cross-correlation) of input <M>{"X"}</M> with a <M>{"k \\times k"}</M> kernel <M>{"W"}</M> produces a feature map whose pixel at row <M>{"i"}</M>, column <M>{"j"}</M> is</p>
        <MB>{"S(i,j) = \\sum_{m=0}^{k-1} \\sum_{n=0}^{k-1} X(i+m,\\, j+n)\\, W(m,n) + b"}</MB>
        <p>With input size <M>{"n"}</M>, kernel <M>{"k"}</M>, padding <M>{"p"}</M>, and stride <M>{"s"}</M>, the output side length is</p>
        <MB>{"o = \\left\\lfloor \\frac{n + 2p - k}{s} \\right\\rfloor + 1"}</MB>
        <p>The layer holds only <M>{"k^2"}</M> weights per input-output channel pair regardless of <M>{"n"}</M> &mdash; that is the parameter sharing that makes deep vision feasible.</p>
      </Advanced>

      <Callout kind="pitfall" title="Equivariance is not invariance">
        Convolution is translation-equivariant: the feature map moves with the input. It is not automatically translation-invariant. Pooling and strided downsampling buy approximate invariance, but a CNN still has no built-in robustness to rotation or scale changes &mdash; you get that from data augmentation, not the architecture.
      </Callout>

      <CodeBlock language="python" filename="conv.py">{`import torch.nn as nn

# A tiny conv block: 3 input channels (RGB) -> 16 feature maps
block = nn.Sequential(
    nn.Conv2d(3, 16, kernel_size=3, padding=1),  # keeps spatial size
    nn.BatchNorm2d(16),
    nn.ReLU(),
    nn.MaxPool2d(2),                              # halves H and W
)

# Parameter count: 3*16*3*3 weights + 16 biases = 448
params = sum(p.numel() for p in block[0].parameters())
print(params)  # 448 -- independent of image resolution`}</CodeBlock>

      <MoreDepth>
        <p>Modern designs lean on the receptive-field arithmetic above. A 5&times;5 filter can be replaced by two stacked 3&times;3 filters: same effective field, fewer parameters (<M>{"2 \\cdot 9 = 18"}</M> vs <M>{"25"}</M>), and an extra nonlinearity. Depthwise-separable convolutions (MobileNet) push this further by factoring a conv into a per-channel spatial filter plus a 1&times;1 pointwise mix, cutting cost by roughly <M>{"1/k^2"}</M>. Even as Vision Transformers rise, these locality priors keep CNNs strong in low-data regimes where the inductive bias substitutes for examples.</p>
      </MoreDepth>

      <Quiz question="Why does a convolutional layer use far fewer parameters than a fully connected layer for images?" options={[
        { text: "It reuses the same small filter across every spatial location instead of a unique weight per pixel pair", correct: true, why: "Weight sharing means parameter count depends on kernel size and channels, not image resolution." },
        { text: "It throws away color channels to save memory", why: "Channels are kept; conv layers operate across all input channels." },
        { text: "It uses lower-precision floats than dense layers", why: "Precision is a separate engineering choice, unrelated to the conv parameter savings." },
        { text: "It only connects to the first pixel of the image", why: "It connects to a local patch at every location, not a single pixel." },
      ]} />
    </>
  );
}
