import { SwipeDeck } from "@/components/swipe/SwipeDeck";

export default function SwipeScreenPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Discover</h2>
        <p className="text-sm text-slate-500">TMDB titles you haven&apos;t judged yet · swipes sync to Postgres.</p>
      </div>
      <SwipeDeck />
    </div>
  );
}
