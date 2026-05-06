import { SwipeDeck } from "@/components/swipe/SwipeDeck";
import { PageHeading } from "@/components/layout/PageHeading";

export default function SwipeScreenPage() {
  return (
    <div className="space-y-2">
      <PageHeading
        eyebrow="Now showing"
        title="PICK YOUR NEXT SHOW"
        subtitle="Swipe the card — right if you’d watch it, left to pass. Skip jumps ahead without grading. Matches appear when friends feel the same way."
      />
      <SwipeDeck />
    </div>
  );
}
