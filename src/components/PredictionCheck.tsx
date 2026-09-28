import { copy } from "../copy";
import type { Outcome } from "../data/ladderRules";
import { SegmentedControl } from "./SegmentedControl";
import { TextArea } from "./TextArea";

type Likelihood = keyof typeof copy.prediction.likelihood;
const t = copy.prediction;

/** Before a rep (Task detail, "Before the next one"). Only with the prediction check on. */
export function PredictionBefore({
  text,
  likelihood,
  onText,
  onLikelihood,
}: {
  text: string;
  likelihood: Likelihood | null;
  onText: (text: string) => void;
  onLikelihood: (value: Likelihood) => void;
}) {
  return (
    <section className="db-prediction">
      <div className="db-prediction-head">
        <h2 className="t-heading db-prediction-h">{t.beforeHeading}</h2>
        <span className="db-prediction-optional">{t.optional}</span>
      </div>
      <TextArea
        label={t.whatWillHappen}
        rows={2}
        value={text}
        onChange={(e) => onText(e.target.value)}
      />
      <span className="db-field-label">{t.howLikely}</span>
      <SegmentedControl
        label={t.howLikely}
        value={likelihood}
        onChange={onLikelihood}
        options={(Object.keys(t.likelihood) as Likelihood[]).map((v) => ({
          value: v,
          label: t.likelihood[v],
        }))}
      />
      <p className="db-prediction-helper">{t.beforeHelper}</p>
    </section>
  );
}

/** After a rep (Log a rep): what you wrote before, and "Did it happen?". */
export function PredictionAfter({
  prediction,
  outcome,
  onOutcome,
}: {
  prediction: string;
  outcome: Outcome | null;
  onOutcome: (value: Outcome) => void;
}) {
  return (
    <section className="db-prediction">
      <span className="db-prediction-lead">{t.afterLead}</span>
      <blockquote className="db-prediction-quote">{copy.controls.quote(prediction)}</blockquote>
      <span className="db-field-label">{t.didItHappen}</span>
      <SegmentedControl
        label={t.didItHappen}
        value={outcome}
        onChange={onOutcome}
        options={(Object.keys(t.outcome) as Outcome[]).map((v) => ({
          value: v,
          label: t.outcome[v],
        }))}
      />
    </section>
  );
}
