"use client";

import { Basic, Advanced, MoreDepth } from "@/components/content/tiered";
import { Callout } from "@/components/content/callout";
import { KeyIdea } from "@/components/content/key-idea";
import { M, MB } from "@/components/content/math";
import { Quiz } from "@/components/content/quiz";
import { CLTSimulator } from "@/components/viz/clt-simulator";
import { InterviewProblem } from "@/components/content/interview-problem";
import { CodeBlock } from "@/components/content/code-block";

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
    <h2>Interview practice</h2>
<InterviewProblem question="Explain the Central Limit Theorem in plain terms. What exactly becomes normal, and what does NOT?" difficulty="easy" tag="Conceptual">
  <p>The CLT says that if you take many independent samples of size <M>{"n"}</M> from a population with finite mean <M>{"\\mu"}</M> and finite variance <M>{"\\sigma^2"}</M>, the distribution of the <strong>sample mean</strong> <M>{"\\bar{X}"}</M> approaches a normal distribution as <M>{"n"}</M> grows &mdash; no matter what shape the original population has.</p>
  <p>The key distinction interviewers probe:</p>
  <ul>
    <li>What goes normal: the <strong>sampling distribution of the mean</strong> (the distribution of <M>{"\\bar{X}"}</M> across hypothetical repeated samples).</li>
    <li>What does NOT change: the <strong>distribution of the raw data</strong>. A skewed population stays skewed no matter how big <M>{"n"}</M> is. The CLT is a statement about averages, not individual observations.</li>
  </ul>
  <p>Formally, the standardized mean converges in distribution:</p>
  <MB>{"\\frac{\\bar{X}_n - \\mu}{\\sigma/\\sqrt{n}} \\xrightarrow{d} \\mathcal{N}(0, 1)"}</MB>
  <p>A common follow-up: &quot;does CLT need the data to be normal?&quot; No &mdash; that is the entire point. It only needs finite variance and (roughly) independence.</p>
</InterviewProblem>
<InterviewProblem question="Derive the standard error of the sample mean and explain the 1/sqrt(n) law. If a poll of 1,000 people gives a margin of error of 3%, how many people do you need to halve it?" difficulty="medium" tag="Math">
  <p>For i.i.d. observations <M>{"X_1, \\dots, X_n"}</M> with variance <M>{"\\sigma^2"}</M>, the mean is <M>{"\\bar{X} = \\frac{1}{n}\\sum_i X_i"}</M>. Using linearity and independence:</p>
  <MB>{"\\operatorname{Var}(\\bar{X}) = \\frac{1}{n^2}\\sum_{i=1}^{n}\\operatorname{Var}(X_i) = \\frac{1}{n^2}\\cdot n\\sigma^2 = \\frac{\\sigma^2}{n}"}</MB>
  <p>Taking the square root gives the <strong>standard error</strong>:</p>
  <MB>{"\\operatorname{SE}(\\bar{X}) = \\frac{\\sigma}{\\sqrt{n}}"}</MB>
  <p>So uncertainty shrinks like <M>{"1/\\sqrt{n}"}</M>, not <M>{"1/n"}</M>. This is the famous law of diminishing returns in sampling.</p>
  <p>For the poll: margin of error scales with the standard error, so to halve it you must double <M>{"1/\\sqrt{n}"}</M>'s denominator &mdash; meaning <M>{"\\sqrt{n}"}</M> must double, so <M>{"n"}</M> must <strong>quadruple</strong>. You need about <strong>4,000 people</strong> to go from 3% to 1.5%. Quartering the error to 0.75% would need 16,000. This brutal scaling is why huge surveys still report a couple percent of error.</p>
</InterviewProblem>
<InterviewProblem question="How would you empirically demonstrate the CLT to a skeptical stakeholder using a heavily skewed distribution, and what would you watch for?" difficulty="medium" tag="Coding">
  <p>Take a maximally non-normal source &mdash; an exponential is great because it is right-skewed and bounded below at zero &mdash; then repeatedly draw samples, average each, and show the histogram of those averages tightening into a bell curve as <M>{"n"}</M> rises.</p>
  <CodeBlock language="python" filename="clt_demo.py">{`import numpy as np

rng = np.random.default_rng(0)
lam = 1.0                      # exponential rate
pop_mean, pop_sd = 1/lam, 1/lam   # mean = sd = 1/lambda

for n in [1, 5, 30, 100]:
    # 50k sample means, each from a sample of size n
    means = rng.exponential(scale=1/lam, size=(50_000, n)).mean(axis=1)

    se_theory = pop_sd / np.sqrt(n)         # CLT prediction
    se_empirical = means.std(ddof=1)        # observed spread of means
    skew = ((means - means.mean())**3).mean() / means.std()**3

    print(f"n={n:>3}  mean={means.mean():.3f}  "
          f"SE_theory={se_theory:.3f}  SE_obs={se_empirical:.3f}  "
          f"skew={skew:.3f}")`}</CodeBlock>
  <p>What to watch for and explain:</p>
  <ul>
    <li>The empirical SE should track <M>{"\\sigma/\\sqrt{n}"}</M> closely &mdash; concrete proof of the <M>{"1/\\sqrt{n}"}</M> law.</li>
    <li>Skewness should march toward 0 as <M>{"n"}</M> grows. At <M>{"n=1"}</M> the histogram is just the raw exponential (skew near 2); by <M>{"n=30"}</M> it looks Gaussian.</li>
    <li>The mean of the means stays at <M>{"\\mu"}</M> for every <M>{"n"}</M> &mdash; the mean is unbiased; only its spread and shape change.</li>
  </ul>
</InterviewProblem>
<InterviewProblem question="A junior analyst says 'n=30 is always enough for the CLT to kick in.' When does this rule of thumb fail, and how does this connect to confidence intervals?" difficulty="hard" tag="Case">
  <p>The &quot;<M>{"n \\geq 30"}</M>&quot; heuristic is a convenience, not a theorem. How fast the sampling distribution converges depends on the source distribution's shape &mdash; quantified by the Berry&ndash;Esseen bound, which says the error in the normal approximation shrinks like <M>{"\\rho/(\\sigma^3\\sqrt{n})"}</M>, where <M>{"\\rho = E|X-\\mu|^3"}</M> is the third absolute moment. Heavier asymmetry and tails mean slower convergence.</p>
  <p>Cases where <M>{"n=30"}</M> is nowhere near enough:</p>
  <ul>
    <li><strong>Extreme skew or heavy tails:</strong> a lognormal of income, or a power-law of click counts, can need thousands of points before <M>{"\\bar{X}"}</M> looks normal.</li>
    <li><strong>Rare events:</strong> for a proportion with tiny <M>{"p"}</M> (say a 0.1% conversion), you effectively need <M>{"np \\gtrsim 10"}</M>, so <M>{"n=30"}</M> with <M>{"p=0.001"}</M> is hopeless &mdash; you see almost all zeros.</li>
    <li><strong>Infinite variance:</strong> if <M>{"\\sigma^2"}</M> does not exist (e.g. a Cauchy distribution), the CLT simply <strong>does not apply</strong> &mdash; the mean of Cauchy draws is itself Cauchy, no matter how large <M>{"n"}</M> is.</li>
    <li><strong>Strong dependence:</strong> the classic CLT assumes independence; heavily autocorrelated data (time series) converges far slower and needs an effective sample size adjustment.</li>
  </ul>
  <p>The connection to inference: a confidence interval like <M>{"\\bar{X} \\pm 1.96\\,\\sigma/\\sqrt{n}"}</M> borrows its <strong>1.96</strong> directly from the normal distribution. That number is only valid if the sampling distribution of <M>{"\\bar{X}"}</M> is actually normal. When the CLT has not kicked in, the interval's true coverage is wrong &mdash; it may claim 95% but cover far less, especially in the skewed tail. The safe move is to bootstrap the sampling distribution rather than trust the normal approximation, since bootstrapping makes no shape assumption.</p>
</InterviewProblem>

      </>
  );
}
