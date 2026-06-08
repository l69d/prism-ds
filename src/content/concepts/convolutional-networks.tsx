"use client";

import { Basic, Advanced, MoreDepth } from "@/components/content/tiered";
import { Callout } from "@/components/content/callout";
import { KeyIdea } from "@/components/content/key-idea";
import { M, MB } from "@/components/content/math";
import { CodeBlock } from "@/components/content/code-block";
import { Quiz } from "@/components/content/quiz";
import { InterviewProblem } from "@/components/content/interview-problem";

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
    <h2>Interview practice</h2>

<InterviewProblem question="Why do convolutional layers use weight sharing and local connectivity instead of fully connected layers for images?" difficulty="easy" tag="Conceptual">
  <p>A fully connected layer on a small <M>{"224\\times224\\times3"}</M> image would need a weight for every input pixel feeding every hidden unit. Convolutions replace that with two key inductive biases:</p>
  <ul>
    <li><strong>Local connectivity:</strong> each output only looks at a small receptive field (e.g. <M>{"3\\times3"}</M>), because nearby pixels are far more correlated than distant ones. Edges and textures are local patterns.</li>
    <li><strong>Weight sharing:</strong> the same filter slides across all spatial positions, so a feature detector learned in one corner works everywhere. This gives <strong>translation equivariance</strong> &mdash; shift the input, the feature map shifts the same way.</li>
  </ul>
  <p>The payoff is a massive cut in parameters and built-in statistical efficiency. A single <M>{"3\\times3"}</M> filter over 64 input channels producing 64 output channels uses <M>{"3\\cdot3\\cdot64\\cdot64 \\approx 37\\text{k}"}</M> weights regardless of image size, whereas a dense layer would scale with the pixel count. Fewer parameters means less overfitting and the ability to generalize to inputs of varying size.</p>
</InterviewProblem>

<InterviewProblem question="Given an input of size 32x32 with 3 channels, a conv layer with 16 filters of size 5x5, stride 2, padding 1, what is the output spatial size and the number of parameters?" difficulty="medium" tag="Math">
  <p>The output spatial dimension along one axis follows the standard formula, where <M>{"W"}</M> is input size, <M>{"F"}</M> the filter size, <M>{"P"}</M> the padding, and <M>{"S"}</M> the stride:</p>
  <MB>{"W_{\\text{out}} = \\left\\lfloor \\frac{W - F + 2P}{S} \\right\\rfloor + 1"}</MB>
  <p>Plugging in <M>{"W=32,\\ F=5,\\ P=1,\\ S=2"}</M>:</p>
  <MB>{"W_{\\text{out}} = \\left\\lfloor \\frac{32 - 5 + 2}{2} \\right\\rfloor + 1 = \\left\\lfloor \\frac{29}{2} \\right\\rfloor + 1 = 14 + 1 = 15"}</MB>
  <p>So the output tensor is <M>{"15\\times15\\times16"}</M> (16 channels, one per filter).</p>
  <p>For parameters: each filter spans the full input depth, so it has <M>{"5\\times5\\times3 = 75"}</M> weights plus 1 bias. With 16 filters:</p>
  <MB>{"(5\\cdot5\\cdot3 + 1)\\cdot 16 = 76\\cdot 16 = 1216"}</MB>
  <p>The key trap: the parameter count is independent of the input spatial size &mdash; only the depth, kernel size, and filter count matter.</p>
</InterviewProblem>

<InterviewProblem question="A model trained on centered, upright product photos fails on user uploads that are rotated and off-center. The architecture is already a strong CNN. How would you diagnose and fix this?" difficulty="hard" tag="Applied">
  <p>The symptom points at a <strong>train/test distribution mismatch</strong>, not model capacity. CNNs are approximately translation-equivariant but they are <strong>not</strong> rotation- or scale-invariant by construction, so unseen poses break them.</p>
  <p><strong>Diagnose first:</strong></p>
  <ul>
    <li>Slice validation accuracy by rotation angle and crop offset. If accuracy falls off sharply as either grows, you have confirmed the invariance gap rather than a generic generalization problem.</li>
    <li>Check that the failure is not a preprocessing bug (e.g. EXIF orientation being dropped on upload) before retraining anything.</li>
  </ul>
  <p><strong>Fix, in order of cost:</strong></p>
  <ul>
    <li><strong>Data augmentation</strong> is the first lever: random rotations, crops, flips, and scale jitter at train time teach the network the invariances you need. This is cheap and usually sufficient.</li>
    <li><strong>Test-time augmentation</strong>: average predictions over several rotated and cropped versions of each upload for an immediate boost without retraining.</li>
    <li><strong>Architectural priors</strong> if augmentation plateaus: global average pooling instead of a flattened dense head reduces sensitivity to position, and stronger pooling buys some local invariance.</li>
    <li><strong>Collect representative data</strong>: the cleanest long-term fix is to label real user uploads so training data matches deployment, closing the covariate shift directly.</li>
  </ul>
</InterviewProblem>

<InterviewProblem question="Implement a 2D convolution forward pass from scratch in NumPy (valid padding, single channel) and verify it against a known kernel." difficulty="medium" tag="Coding">
  <p>The core idea is to slide the kernel over every valid position and compute an elementwise-product sum. With input <M>{"H\\times W"}</M> and kernel <M>{"k_h\\times k_w"}</M>, the output is <M>{"(H-k_h+1)\\times(W-k_w+1)"}</M>.</p>
  <p>Note that deep-learning &quot;convolution&quot; is really <strong>cross-correlation</strong> &mdash; the kernel is applied without flipping, since the network learns the kernel anyway. The code below matches that convention.</p>
  <CodeBlock language="python" filename="conv2d.py">{`import numpy as np

def conv2d(x, kernel):
    H, W = x.shape
    kh, kw = kernel.shape
    out_h, out_w = H - kh + 1, W - kw + 1
    out = np.zeros((out_h, out_w))
    for i in range(out_h):
        for j in range(out_w):
            patch = x[i:i+kh, j:j+kw]
            out[i, j] = np.sum(patch * kernel)
    return out

# Verify: a vertical-edge (Sobel-x) kernel on a left/right split image
x = np.array([
    [0, 0, 0, 1, 1, 1],
    [0, 0, 0, 1, 1, 1],
    [0, 0, 0, 1, 1, 1],
    [0, 0, 0, 1, 1, 1],
], dtype=float)

sobel_x = np.array([
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1],
], dtype=float)

print(conv2d(x, sobel_x))
# Strong positive response exactly at the 0->1 vertical boundary,
# zero in the flat regions -> the filter detects vertical edges.`}</CodeBlock>
  <p>A strong interview answer also names the efficient real-world implementation: <strong>im2col</strong> unrolls each patch into a column so the whole convolution becomes one matrix multiply, which is how GPU libraries achieve their speed.</p>
</InterviewProblem>

      </>
  );
}
