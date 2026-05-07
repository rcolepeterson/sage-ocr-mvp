import React from "react";

export default function StyleGuidePage() {
  return (
    <main className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-heading mb-6">Style Guide</h1>
      <section className="mb-10">
        <h2 className="text-2xl font-heading mb-2">Headlines (Poppins)</h2>
        <h1 className="text-5xl font-heading mb-2">H1 — Poppins Bold</h1>
        <h2 className="text-4xl font-heading mb-2">H2 — Poppins SemiBold</h2>
        <h3 className="text-3xl font-heading mb-2">H3 — Poppins Medium</h3>
        <h4 className="text-2xl font-heading mb-2">H4 — Poppins Regular</h4>
      </section>
      <section className="mb-10">
        <h2 className="text-2xl font-heading mb-2">Body Text (Raleway)</h2>
        <p className="text-base font-body mb-2">
          This is a sample paragraph using the Raleway font. Lorem ipsum dolor
          sit amet, consectetur adipiscing elit. Pellentesque euismod, nisi eu
          consectetur.
        </p>
        <p className="text-lg font-body mb-2">
          This is a larger body text using Raleway. Vivamus sagittis lacus vel
          augue laoreet rutrum faucibus dolor auctor.
        </p>
        <ul className="list-disc pl-6 font-body">
          <li>Unordered list item — Raleway</li>
          <li>Another list item — Raleway</li>
        </ul>
      </section>
      <section>
        <h2 className="text-2xl font-heading mb-2">Font Classes</h2>
        <div className="mb-2">
          <span className="font-heading">.font-heading (Poppins)</span>
        </div>
        <div>
          <span className="font-body">.font-body (Raleway)</span>
        </div>
      </section>
    </main>
  );
}
