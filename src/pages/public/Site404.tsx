export default function Site404() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        <h1 className="text-7xl font-light text-[#B8953F]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          404
        </h1>
        <h2 className="text-xl text-[#1A1A1A]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          This site doesn't exist yet
        </h2>
        <p className="text-sm text-[#1A1A1A]/50 max-w-sm mx-auto" style={{ fontFamily: "Inter, sans-serif" }}>
          The domain you entered isn't connected to any photographer's website.
        </p>
        <a
          href="https://mirroraigallery.com"
          className="inline-block mt-4 px-6 py-2.5 rounded-lg bg-[#B8953F] text-white text-sm hover:bg-[#b8985d] transition-colors"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          Visit MirrorAI
        </a>
      </div>
    </div>
  );
}
