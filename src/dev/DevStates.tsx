import { useState, type ReactNode } from "react";
import { Daybook, type Difficulty, type IconName } from "../design/daybook";
import { DateTimeField } from "../components/DateTimeField";
import { Note } from "../components/Note";
import { copy } from "../copy";
import { TextArea } from "../components/TextArea";
import { samples as s } from "./samples";

const {
  Logo,
  Icon,
  Button,
  RatingScale,
  Score,
  FlagToggle,
  Chip,
  TargetProgress,
  PracticeCard,
  EntryCard,
  LadderRung,
  BottomNav,
  EmptyState,
  NotificationCard,
  CrisisFooter,
  SyncStatus,
} = Daybook;

const ICONS: IconName[] = [
  "practice-hierarchy",
  "practice-feelings",
  "practice-gratitude",
  "nav-today",
  "nav-practices",
  "nav-sessions",
  "nav-history",
  "nav-settings",
  "flag",
  "plus",
  "check",
  "chevron-right",
  "bell",
  "saved-local",
  "archive",
  "phone",
  "close",
  "back",
  "share",
  "download",
  "info",
  "cloud",
  "pause",
  "chevron-down",
];
const SCORES: Difficulty[] = [0, 1, 2, 3, 4, 5, 6, 7, 8];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="dev-section">
      <h2 className="t-label">{title}</h2>
      <div className="dev-stack">{children}</div>
    </section>
  );
}

/** /dev/states: every design-system component, for checking on a phone (plan D15). */
export function DevStates() {
  const [rating, setRating] = useState<Difficulty | null>(null);
  const [flagged, setFlagged] = useState(false);
  const [chip, setChip] = useState<string>(s.chips[0]);
  const [when, setWhen] = useState({ date: "", time: "" });
  const [notes, setNotes] = useState("");
  const [nav, setNav] = useState<"today" | "practices" | "sessions" | "history" | "settings">(
    "today",
  );

  return (
    <main className="screen dev-page">
      <h1 className="t-title-lg">{s.pageTitle}</h1>
      <p className="t-small">{s.pageIntro}</p>

      <Section title={s.sections.type}>
        <div className="t-num-hero">{s.typeSample.numHero}</div>
        <div className="t-num-lg">{s.typeSample.numLg}</div>
        <div className="t-num-md">{s.typeSample.numMd}</div>
        <div className="t-title-lg">{s.typeSample.titleLg}</div>
        <div className="t-title">{s.typeSample.title}</div>
        <div className="t-heading">{s.typeSample.heading}</div>
        <div className="t-body">{s.typeSample.body}</div>
        <div className="t-body-strong">{s.typeSample.bodyStrong}</div>
        <div className="t-small">{s.typeSample.small}</div>
        <div className="t-label">{s.typeSample.label}</div>
      </Section>

      <Section title={s.sections.logo}>
        <Logo variant="lockup" />
        <div className="dev-row">
          <Logo variant="mark" size={48} />
          <Logo variant="word" />
        </div>
      </Section>

      <Section title={s.sections.icons}>
        <div className="dev-row">
          {ICONS.map((name) => (
            <Icon key={name} name={name} label={name} />
          ))}
        </div>
      </Section>

      <Section title={s.sections.buttons}>
        <Button variant="primary" size="lg" block>
          {s.buttons.primary}
        </Button>
        <Button variant="secondary">{s.buttons.secondary}</Button>
        <Button variant="quiet">{s.buttons.quiet}</Button>
        <Button variant="primary" size="lg" block disabled>
          {s.buttons.disabled}
        </Button>
      </Section>

      <Section title={s.sections.rating}>
        <RatingScale
          label={s.rating.label}
          hint={s.rating.hint}
          value={rating}
          onChange={setRating}
          lowLabel={s.rating.low}
          highLabel={s.rating.high}
          ends
          showValue
        />
      </Section>

      <Section title={s.sections.score}>
        <div className="dev-row">
          {SCORES.map((v) => (
            <Score key={v} value={v} />
          ))}
        </div>
        <div className="dev-row">
          <Score value={7} ghost />
          <Score value={3} size="sm" />
        </div>
      </Section>

      <Section title={s.sections.flag}>
        <FlagToggle on={flagged} onChange={setFlagged} />
        <FlagToggle on={flagged} onChange={setFlagged} compact />
      </Section>

      <Section title={s.sections.chips}>
        <div className="dev-row">
          {s.chips.map((c) => (
            <Chip key={c} selected={chip === c} onClick={() => setChip(c)}>
              {c}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title={s.sections.target}>
        <TargetProgress done={2} of={4} />
        <TargetProgress done={4} of={4} />
      </Section>

      <Section title={s.sections.practice}>
        <PracticeCard type="hierarchy" {...s.practice.hierarchy} target={{ done: 2, of: 4 }} />
        <PracticeCard type="feelings" {...s.practice.feelings} />
        <PracticeCard type="gratitude" {...s.practice.gratitude} />
      </Section>

      <Section title={s.sections.entry}>
        <EntryCard
          type="hierarchy"
          {...s.entry.rep}
          predicted={7}
          actual={5}
          remaining={2}
          flagged
        />
        <EntryCard
          type="hierarchy"
          {...s.entry.attempt}
          predicted={6}
          actual={6}
          remaining={6}
          attempt
        />
        <EntryCard type="feelings" {...s.entry.feelings} intensity={5} />
      </Section>

      <Section title={s.sections.rung}>
        <LadderRung {...s.rungs.upNext} predicted={5} remaining={4} reps={3} attempts={1} />
        <LadderRung {...s.rungs.oneOff} predicted={7} remaining={null} />
        <LadderRung {...s.rungs.fresh} predicted={8} />
        <LadderRung {...s.rungs.done} predicted={4} remaining={2} reps={5} done />
      </Section>

      <Section title={s.sections.empty}>
        <EmptyState icon="practice-hierarchy" {...s.empty} />
      </Section>

      <Section title={s.sections.notification}>
        <NotificationCard {...s.notification} actions={[...s.notification.actions]} />
      </Section>

      <Section title={s.sections.crisis}>
        <CrisisFooter />
      </Section>

      <Section title={s.sections.sync}>
        <SyncStatus state="saved-local" count={2} />
        <SyncStatus state="synced" />
      </Section>

      <Section title={s.sections.dateTime}>
        <DateTimeField date={when.date} time={when.time} onChange={setWhen} />
        <DateTimeField date="2026-09-29" time="16:00" onChange={() => undefined} />
      </Section>

      <Section title={s.sections.textArea}>
        <TextArea
          heading
          label={s.textArea.label}
          placeholder={s.textArea.placeholder}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
        />
        <TextArea
          quietLabel
          optional
          label={s.textArea.quietLabel}
          placeholder={s.textArea.quietPlaceholder}
          rows={1}
        />
      </Section>

      <Section title={s.sections.note}>
        <Note action={<Button variant="quiet">{copy.update.now}</Button>}>{copy.update.ready}</Note>
      </Section>

      <Section title={s.sections.nav}>
        <BottomNav
          active={nav}
          badges={{ sessions: 3 }}
          onNavigate={(id) => setNav(id as typeof nav)}
        />
      </Section>
    </main>
  );
}
