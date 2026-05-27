"use client";
import dynamic from "next/dynamic";
// Download any free animation from lottiefiles.com and save to /public/animations/placeholder.json
import lottiePlaceholder from "@/lib/animations/placeholder.json";
import { Button } from "@/components/ui/Button";

const LottieAnimation = dynamic(
  () => import("@/components/ui/LottieAnimation"),
  { ssr: false },
);

export default function StyleGuidePage() {
  return (
    <main className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="mb-6">Style Guide</h1>

      {/* Headlines */}
      <section className="mb-10">
        <h2 className="mb-2">Headlines (Poppins)</h2>
        <h1 className="text-5xl mb-2">H1 — Poppins Bold</h1>
        <h2 className="text-4xl mb-2">H2 — Poppins SemiBold</h2>
        <h3 className="text-3xl mb-2">H3 — Poppins Medium</h3>
        <h4 className="text-2xl mb-2">H4 — Poppins Regular</h4>
      </section>

      {/* Body Text */}
      <section className="mb-10">
        <h2 className="mb-2">Body Text (Raleway)</h2>
        <p className="text-base mb-2">
          This is a sample paragraph using the Raleway font. Lorem ipsum dolor
          sit amet, consectetur adipiscing elit. Pellentesque euismod, nisi eu
          consectetur.
        </p>
        <p className="text-lg mb-2">
          This is a larger body text using Raleway. Vivamus sagittis lacus vel
          augue laoreet rutrum faucibus dolor auctor.
        </p>
        <ul className="list-disc pl-6">
          <li>Unordered list item — Raleway</li>
          <li>Another list item — Raleway</li>
        </ul>
      </section>

      {/* Font Classes */}
      <section className="mb-10">
        <h2 className="mb-2">Font Classes</h2>
        <div className="mb-2">
          <span className="font-heading">.font-heading (Poppins)</span>
        </div>
        <div>
          <span className="font-body">.font-body (Raleway)</span>
        </div>
      </section>

      {/* Buttons */}
      <section className="mb-10">
        <h2 className="mb-4">Buttons — Light Background</h2>
        <div className="flex flex-col items-start gap-4">
          <Button variant="primary">Get Started</Button>
          <Button variant="primary" disabled>
            Get Started
          </Button>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-4">Buttons — Dark Background</h2>
        <div className="flex flex-col items-start gap-4 bg-swansons-navy rounded-2xl p-6">
          <Button variant="inverted">Get Started</Button>
          <Button variant="disabledInverted" disabled>
            Get Started
          </Button>
        </div>
      </section>

      {/* Lottie */}
      <section className="mb-10">
        <h2 className="mb-4">Lottie Animation Example</h2>
        <p className="text-swansons-muted text-base mb-6">
          Below is a sample Lottie animation using the{" "}
          <code className="font-mono bg-gray-100 px-1 rounded text-sm">
            LottieAnimation
          </code>{" "}
          component. SSR-safe via dynamic import.
        </p>
        <div className="flex items-center gap-8">
          <div className="w-40 h-40 bg-white rounded-lg shadow flex items-center justify-center">
            <LottieAnimation
              animationData={lottiePlaceholder}
              loop
              autoplay
              className="w-36 h-36"
            />
          </div>
          <pre className="bg-gray-100 rounded-lg p-4 text-xs overflow-x-auto flex-1">
            {`import LottieAnimation from "@/components/ui/LottieAnimation";
import myAnimation from "../../public/animations/placeholder.json";

<LottieAnimation
animationData={myAnimation}
loop
autoplay
className="w-36 h-36"
/>`}
          </pre>
        </div>
      </section>
    </main>
  );
}
