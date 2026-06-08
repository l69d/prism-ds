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
      <p>
        Training a deep network from scratch needs millions of labeled examples and days of compute. Transfer learning sidesteps that: you take a model already trained on a huge dataset and adapt it to your task with a fraction of the data and time.
      </p>

      <KeyIdea>
        A model trained on a large source task has already learned reusable features &mdash; edges, textures, syntax, semantics. Transfer learning keeps those learned representations and only retrains the parts that are task-specific.
      </KeyIdea>

      <h2>Why it works</h2>
      <p>
        Deep networks learn features hierarchically. Early layers capture generic, low-level structure that is useful almost everywhere; later layers capture increasingly task-specific abstractions. Because the early features generalize, you can reuse them and replace only the task-specific head.
      </p>
      <ul>
        <li><strong>Feature extraction:</strong> freeze the pretrained backbone, train only a new classifier head on top.</li>
        <li><strong>Fine-tuning:</strong> unfreeze some (or all) backbone layers and continue training them at a small learning rate.</li>
        <li><strong>Domain match matters:</strong> the closer the source and target domains, the more layers you can safely reuse.</li>
      </ul>

      <Basic>
        <p>
          Think of a chef who has spent years mastering knife skills, heat, and seasoning. To learn a new cuisine, they don&apos;t start from zero &mdash; they keep the fundamentals and just learn the new recipes. A pretrained model is that experienced chef: the &quot;fundamentals&quot; live in its early layers, and your fine-tuning teaches it the new recipe.
        </p>
        <p>
          So with only a few hundred labeled images you can build a strong classifier, because the model already knows what edges, shapes, and textures look like.
        </p>
      </Basic>

      <Advanced>
        <p>
          Let the pretrained network be a composition <M>{"f_\\theta = h_\\phi \\circ g_\\psi"}</M>, where <M>{"g_\\psi"}</M> is the backbone (parameters <M>{"\\psi"}</M>) and <M>{"h_\\phi"}</M> is the head. Feature extraction freezes <M>{"\\psi"}</M> and optimizes only <M>{"\\phi"}</M> on the target loss:
        </p>
        <MB>{"\\phi^\\star = \\arg\\min_\\phi \; \\frac{1}{n} \\sum_{i=1}^{n} \\mathcal{L}\\big(h_\\phi(g_\\psi(x_i)),\\, y_i\\big)"}</MB>
        <p>
          Fine-tuning instead initializes from the pretrained <M>{"\\psi_0"}</M> and updates both, often with a discriminative learning rate that grows toward the head:
        </p>
        <MB>{"\\psi^{(t+1)} = \\psi^{(t)} - \\eta_\\ell \\, \\nabla_\\psi \\mathcal{L}, \\qquad \\eta_\\ell = \\eta_0 \\cdot \\gamma^{\\,L-\\ell}"}</MB>
        <p>
          where <M>{"\\ell"}</M> indexes layers and <M>{"\\gamma < 1"}</M> shrinks the rate for earlier layers. A small <M>{"\\eta"}</M> keeps updates near <M>{"\\psi_0"}</M>, acting as an implicit prior that the good pretrained solution should not be destroyed.
        </p>
      </Advanced>

      <Callout kind="pitfall" title="Catastrophic forgetting from a big learning rate">
        Fine-tuning the backbone with too high a learning rate &mdash; especially before the new head has stabilized &mdash; wipes out the pretrained features the first few noisy gradients pass through. Train the head first, then unfreeze gently with a much smaller rate.
      </Callout>

      <CodeBlock language="python" filename="finetune.py">{`import torch, torch.nn as nn
from torchvision import models

# 1. Load a backbone pretrained on ImageNet
model = models.resnet18(weights="IMAGENET1K_V1")

# 2. Freeze the backbone (feature-extraction phase)
for p in model.parameters():
    p.requires_grad = False

# 3. Replace the head for our 3-class task
model.fc = nn.Linear(model.fc.in_features, 3)  # only this trains

# 4. Train just the head first
opt = torch.optim.Adam(model.fc.parameters(), lr=1e-3)

# 5. Later: unfreeze and fine-tune the whole net at a tiny LR
for p in model.parameters():
    p.requires_grad = True
opt = torch.optim.Adam(model.parameters(), lr=1e-5)
`}</CodeBlock>

      <MoreDepth>
        <p>
          The transfer benefit is not symmetric across the network. Yosinski et al. showed that co-adapted middle layers can transfer worse than either end, and that fine-tuning recovers fragile co-adaptations that pure feature extraction cannot. When the target dataset is tiny and the domain is close, freeze more; when it is large or the domain shifts, unfreeze more &mdash; the data is enough to re-learn safely without overfitting. With modern foundation models, parameter-efficient methods like LoRA take this further: they freeze the entire backbone and learn only small low-rank update matrices, capturing most of the fine-tuning gain at a fraction of the trainable parameters.
        </p>
      </MoreDepth>

      <Quiz question="You have only 200 labeled images in a domain very similar to ImageNet. What is the safest first approach?" options={[
        { text: "Train a ResNet from random initialization", why: "200 images is far too few to learn good features from scratch; it will overfit badly." },
        { text: "Freeze the pretrained backbone and train only a new classifier head", correct: true, why: "With little data and a close domain, reusing frozen features and training just the head minimizes overfitting." },
        { text: "Unfreeze all layers and fine-tune at a large learning rate", why: "A large rate on the full network with tiny data causes catastrophic forgetting and overfitting." },
        { text: "Use the pretrained model's predictions directly without any new head", why: "Its head outputs the source classes, not your target classes, so it cannot solve your task." },
      ]} />
    <h2>Interview practice</h2>
<InterviewProblem question="Explain why transfer learning works. Why can features learned on one task help a different task?" difficulty="easy" tag="Conceptual">
  <p>A deep network trained on a large dataset learns a <strong>hierarchy of features</strong>. Early layers capture generic, low-level structure that recurs across almost any input of that modality:</p>
  <ul>
    <li>In vision: edges, corners, color blobs, then textures, then object parts.</li>
    <li>In NLP: subword statistics, syntax, then semantic and discourse structure.</li>
  </ul>
  <p>These generic features are <strong>task-agnostic</strong> — an edge detector is useful whether you are classifying cats or tumors. Only the last few layers are specialized to the original labels. So instead of relearning generic features from scratch (which needs a lot of data and compute), we <strong>reuse the pretrained representation</strong> and only adapt the task-specific head. This is most valuable when your target dataset is small: the pretrained weights act as a strong, data-efficient prior.</p>
  <p>The catch: transfer helps only when source and target <strong>domains share low-level structure</strong>. Transferring an ImageNet backbone to natural photos works well; transferring it to raw audio spectrograms or tabular data helps far less, because the generic features no longer match.</p>
</InterviewProblem>
<InterviewProblem question="You have a pretrained ImageNet ResNet and 2,000 labeled medical images. Walk me through how you would adapt it, and how the strategy changes with dataset size and domain similarity." difficulty="medium" tag="Applied">
  <p>The two main knobs are <strong>which layers to freeze</strong> and <strong>what learning rate to use</strong>. A useful 2x2 framework over (dataset size) x (domain similarity to source):</p>
  <ul>
    <li><strong>Small data, similar domain:</strong> freeze the backbone, train only a new head (linear probe / feature extraction). Few parameters to fit, low overfitting risk.</li>
    <li><strong>Small data, different domain:</strong> freeze the early layers (generic) but fine-tune the later layers; heavy regularization and augmentation. Risky — too little data to retrain much.</li>
    <li><strong>Large data, similar domain:</strong> fine-tune the whole network with a small learning rate.</li>
    <li><strong>Large data, different domain:</strong> fine-tune everything, or even retrain from scratch since the prior helps less.</li>
  </ul>
  <p>With only 2,000 medical images (small) and a domain that is fairly different from ImageNet photos, I would start with a frozen backbone + new head, then optionally <strong>unfreeze the top block and fine-tune with a small LR</strong>. Concretely:</p>
  <CodeBlock language="python" filename="finetune.py">{`import torch, torch.nn as nn
from torchvision import models

model = models.resnet50(weights="IMAGENET1K_V2")

# Stage 1: freeze backbone, replace + train head only
for p in model.parameters():
    p.requires_grad = False
model.fc = nn.Linear(model.fc.in_features, num_classes)  # new head
opt = torch.optim.Adam(model.fc.parameters(), lr=1e-3)
# ... train the head for a few epochs ...

# Stage 2: unfreeze last block, fine-tune with a SMALL lr
for p in model.layer4.parameters():
    p.requires_grad = True
opt = torch.optim.Adam(
    [{"params": model.layer4.parameters(), "lr": 1e-5},
     {"params": model.fc.parameters(),     "lr": 1e-4}])
`}</CodeBlock>
  <p>Key practical points I would mention: <strong>use a much smaller LR for pretrained weights than for the new head</strong> (often 10-100x smaller) so you do not wreck the learned features; keep <strong>BatchNorm in eval / frozen-stats mode</strong> when the batch is tiny; add strong augmentation; and prefer discriminative (layer-wise) learning rates so deeper, more specialized layers move more than the generic early ones.</p>
</InterviewProblem>
<InterviewProblem question="What is catastrophic forgetting in fine-tuning, and why does using a smaller learning rate on pretrained layers help avoid it?" difficulty="hard" tag="Math">
  <p><strong>Catastrophic forgetting</strong> is when fine-tuning on the new task overwrites the useful pretrained features, destroying the very prior you wanted to exploit. It shows up as the model overfitting the small target set while its general representation degrades.</p>
  <p>Think of the pretrained weights <M>{"\\theta_0"}</M> as sitting near a good minimum of the source loss. A gradient step on the target loss <M>{"L_t"}</M> moves them by</p>
  <MB>{"\\theta \\leftarrow \\theta_0 - \\eta\\, \\nabla_\\theta L_t(\\theta_0)."}</MB>
  <p>The displacement is <M>{"\\lVert \\Delta\\theta \\rVert = \\eta\\, \\lVert \\nabla_\\theta L_t \\rVert"}</M>, so it scales <strong>linearly with the learning rate</strong> <M>{"\\eta"}</M>. With a large <M>{"\\eta"}</M>, plus large early gradients from a randomly initialized head, the weights are yanked far from <M>{"\\theta_0"}</M> and the source-task knowledge is lost. A small <M>{"\\eta"}</M> keeps <M>{"\\theta"}</M> in the neighborhood of <M>{"\\theta_0"}</M> where the pretrained features still hold.</p>
  <p>This also motivates an explicit anchor: add a penalty that pulls weights back toward <M>{"\\theta_0"}</M>,</p>
  <MB>{"L(\\theta) = L_t(\\theta) + \\frac{\\lambda}{2}\\,\\lVert \\theta - \\theta_0 \\rVert^2,"}</MB>
  <p>and weighting each parameter by its importance to the source task (its Fisher information) gives <strong>Elastic Weight Consolidation</strong>. Other standard mitigations: warm up the head first while the backbone is frozen (so the head&apos;s gradients are not huge when the backbone unfreezes), use discriminative learning rates, and unfreeze gradually from the top down.</p>
</InterviewProblem>
<InterviewProblem question="A teammate fine-tunes a pretrained language model on a 500-example sentiment task and gets 99% train accuracy but 70% on a held-out set, worse than a frozen-features + logistic-regression baseline. What is going on and what would you change?" difficulty="medium" tag="Case">
  <p>The symptom — near-perfect train accuracy, a large train/val gap, and being beaten by a simpler frozen baseline — is classic <strong>overfitting from fully fine-tuning a high-capacity model on too little data</strong>. With hundreds of millions of parameters and only 500 examples, the model can memorize the training set and, in the process, drifts away from its pretrained representation (catastrophic forgetting), losing generalization.</p>
  <p>The frozen-features baseline wins precisely because it has far fewer trainable parameters, so it cannot overfit as badly and it keeps the pretrained representation intact.</p>
  <p>What I would change, roughly in order:</p>
  <ul>
    <li><strong>Train fewer parameters:</strong> freeze the encoder and train only a head, or use a parameter-efficient method (LoRA / adapters) so only a small number of weights move.</li>
    <li><strong>Lower the learning rate</strong> and train for fewer epochs with early stopping on validation, not training, loss.</li>
    <li><strong>Add regularization:</strong> dropout, weight decay, and an anchor toward the pretrained weights.</li>
    <li><strong>Get more signal:</strong> data augmentation / back-translation, or pool in related labeled data.</li>
    <li><strong>Validate properly:</strong> with 500 examples, use cross-validation so the 70% number is not just a noisy small-split estimate.</li>
  </ul>
  <p>The general lesson: <strong>match model capacity (and how much of it you let move) to the amount of target data</strong>. Less data should mean freezing more and updating less.</p>
</InterviewProblem>

      </>
  );
}
