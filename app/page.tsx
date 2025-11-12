import { FeatureGrid } from "./_components/feature-grid";
import { HomeHero } from "./_components/home-hero";

export default function Home() {
  return (
    <div className="relative flex flex-col gap-20">
      <HomeHero />
      <FeatureGrid />
    </div>
  );
}
