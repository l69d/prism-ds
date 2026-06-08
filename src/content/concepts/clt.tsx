"use client";

import { Basic, Advanced, MoreDepth } from "@/components/content/tiered";
import { Callout } from "@/components/content/callout";
import { KeyIdea } from "@/components/content/key-idea";
import { M, MB } from "@/components/content/math";
import { Quiz } from "@/components/content/quiz";
import { CLTSimulator } from "@/components/viz/clt-simulator";

export default function CltContent() {
  return (
    <>
      <p>
        The Central Limit Theorem (CLT) is the result that makes most of statistics work. It says
        that when you <strong>average enough independent samples</strong>, the distribution of that
        average is approximately <strong>normal</strong> — no matter what the original data looked like.
      </p>

      <KeyIdea>
        Individual data can be wildly skewed or bimodal. But the <em>average</em> of a sample behaves
        predictably: it&apos;s bell-shaped, centred on the true mean, and gets tighter as the sample
        grows. That predictability is what lets us build confidence intervals and run tests.
      </KeyIdea>

      <p>
        Pick a clearly non-normal population below — skewed or bimodal — then draw samples and watch
        the distribution of the sample mean. The cyan curve is the normal the CLT predicts.
      </p>

      <CLTSimulator />

      <h2>What exactly becomes normal?</h2>
      <Basic>
        <p>
          Not the data — the <strong>average of a sample</strong>. If you repeatedly grab <M>{"n"}</M>
          {" "}values and average them, those averages pile up into a bell curve. The bigger each
          sample is, the narrower and more bell-shaped the pile becomes.
        </p>
      </Basic>
      <Advanced>
        <p>
          For i.i.d. samples with mean <M>{"\\mu"}</M> and finite variance <M>{"\\sigma^2"}</M>, the
          sample mean <M>{"\\bar{X}_n"}</M> satisfies
        </p>
        <MB>{"\\sqrt{n}\\,(\\bar{X}_n - \\mu) \\xrightarrow{d} \\mathcal{N}(0, \\sigma^2)"}</MB>
        <p>
          Equivalently <M>{"\\bar{X}_n \\approx \\mathcal{N}\\!\\left(\\mu, \\tfrac{\\sigma^2}{n}\\right)"}</M>.
          The <strong>standard error</strong> <M>{"\\sigma/\\sqrt{n}"}</M> shrinks like
          {" "}<M>{"1/\\sqrt{n}"}</M> — to halve your uncertainty you need four times the data.
        </p>
      </Advanced>

      <Callout kind="warning" title="The fine print">
        The CLT needs <strong>independent</strong> samples and a <strong>finite variance</strong>.
        Heavy-tailed distributions (like a Cauchy) never settle down. And &quot;large enough n&quot;
        depends on skew — symmetric data converges by n≈15, very skewed data may need n in the hundreds.
      </Callout>

      <MoreDepth>
        <p>
          The <M>{"1/\\sqrt{n}"}</M> law is why polling 1,000 people gives a margin of error around
          ±3% regardless of whether the population is a town or a country — the standard error depends
          on sample size, not population size. It&apos;s also why diminishing returns set in fast:
          going from 1,000 to 2,000 samples only tightens the interval by a factor of <M>{"\\sqrt{2}"}</M>.
        </p>
      </MoreDepth>

      <Quiz
        question="You quadruple your sample size from 250 to 1,000. Roughly what happens to the standard error of the mean?"
        options={[
          { text: "It drops to 1/4.", why: "SE scales with 1/√n, not 1/n." },
          { text: "It halves.", correct: true, why: "SE ∝ 1/√n, and √4 = 2, so it halves." },
          { text: "It stays the same.", why: "More data always tightens the estimate of the mean." },
          { text: "It depends on the population size.", why: "SE depends on sample size and variance, not population size." },
        ]}
      />
    </>
  );
}
