import { Daybook, type IconName } from "../design/daybook";

const { EmptyState } = Daybook;

interface Props {
  title: string;
  emptyTitle: string;
  emptyBody: string;
  icon: IconName;
}

/** A tab whose real screen arrives in a later phase: its title and an empty state. */
export function PlaceholderScreen({ title, emptyTitle, emptyBody, icon }: Props) {
  return (
    <main className="screen">
      <h1 className="t-title-lg screen-title">{title}</h1>
      <EmptyState icon={icon} title={emptyTitle} body={emptyBody} />
    </main>
  );
}
