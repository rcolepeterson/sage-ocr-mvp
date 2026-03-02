import plantsData from "@/data/plants.json";
import { notFound } from "next/navigation";

interface Plant {
  id: string;
  commonName: string;
  latinName: string;
  category: string;
  light: string;
  water: string;
}

const plants = plantsData as Plant[];

export function generateStaticParams() {
  console.log("[Plant] generateStaticParams called");
  console.log("[Plant] plants length:", plants.length);
  console.log(
    "[Plant] ids:",
    plants.map((p) => p.id),
  );
  return plants.map((plant) => ({ id: plant.id }));
}

export default async function PlantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  console.log("[Plant] raw params:", params);

  const resolved = await params;
  console.log("[Plant] resolved params:", resolved);

  const { id } = resolved || {};
  console.log("[Plant] id:", id);

  console.log("[Plant] plants length:", plants.length);
  console.log(
    "[Plant] ids:",
    plants.map((p) => p.id),
  );

  const plant = plants.find((p) => p.id === id);
  console.log("[Plant] matched plant:", plant);

  if (!plant) {
    console.log("[Plant] NOT FOUND for id:", id);
    return notFound();
  }

  return (
    <main className="max-w-md mx-auto mt-8 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-2">{plant.commonName}</h1>
      <p className="italic mb-2">{plant.latinName}</p>
      <div className="mb-2">
        <span className="font-semibold">Category:</span> {plant.category}
      </div>
      <div className="mb-2">
        <span className="font-semibold">Light:</span> {plant.light}
      </div>
      <div>
        <span className="font-semibold">Water:</span> {plant.water}
      </div>
    </main>
  );
}
