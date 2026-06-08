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
    </>
  );
}
