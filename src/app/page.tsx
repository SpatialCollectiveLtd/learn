import { BackgroundBeams } from "@/components/ui/background-beams";
import { CometCard } from "@/components/ui/comet-card";
import { FloatingHeader } from "@/components/ui/floating-header";
import Link from "next/link";
import { IconMap, IconDeviceMobile, IconHome, IconChecklist } from "@tabler/icons-react";

export default function Home() {
  const modules = [
    {
      title: "Digitization",
      description: "Learn digital mapping, satellite image interpretation, and working with global mapping communities using JOSM and HOT Tasking Manager.",
      link: "/digitization",
      icon: <IconMap className="w-16 h-16" />,
      image: "https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?q=80&w=1287&auto=format&fit=crop",
      code: "DIG1",
    },
    {
      title: "Mobile Mapping",
      description: "Master field data collection techniques using mobile devices for real-time mapping and survey applications.",
      link: "/mobile-mapping",
      icon: <IconDeviceMobile className="w-16 h-16" />,
      image: "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?q=80&w=1287&auto=format&fit=crop",
      code: "MOB2",
    },
    {
      title: "Household Survey",
      description: "Conduct comprehensive household surveys with professional data collection methodologies and best practices.",
      link: "/household-survey",
      icon: <IconHome className="w-16 h-16" />,
      image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1287&auto=format&fit=crop",
      code: "HSV3",
    },
    {
      title: "Microtasking",
      description: "Complete and validate small mapping tasks efficiently with quality assurance and validation workflows.",
      link: "/microtasking",
      icon: <IconChecklist className="w-16 h-16" />,
      image: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?q=80&w=1287&auto=format&fit=crop",
      code: "MCR4",
    },
  ];

  return (
    <main className="min-h-screen bg-black relative overflow-hidden">
      {/* Background Effects */}
      <BackgroundBeams className="opacity-40" />
      
      {/* Floating Header */}
      <FloatingHeader />
      
      {/* Content */}
      <div className="relative z-10 pt-20">
        {/* Hero Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">\n          <div className="text-center max-w-5xl mx-auto mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-6xl font-heading font-bold text-white mb-4 sm:mb-6 leading-tight">
              Welcome to Your
              <span className="text-[#dc2626]"> Training Hub</span>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-[#e5e5e5] max-w-3xl mx-auto leading-relaxed">
              Master essential skills in digital mapping, field data collection, and survey methodologies. 
              Follow along with your trainer through interactive, step-by-step modules.
            </p>
          </div>

          {/* Training Modules */}
          <div className="max-w-3xl mx-auto px-4">
            <h3 className="text-2xl sm:text-3xl font-subheading font-bold text-white mb-8 text-center">
              Select Your Training Module
            </h3>
            <div className="grid grid-cols-2 gap-4 md:gap-6">
              {modules.map((module, index) => (
                <CometCard key={index} rotateDepth={15} translateDepth={25}>
                  <Link href={module.link}>
                    <button
                      type="button"
                      className="flex w-full cursor-pointer flex-col items-stretch rounded-xl border-0 bg-[#1F2121] p-1.5 transition-all hover:bg-[#252727] md:p-2.5"
                      aria-label={`View ${module.title} training`}
                      style={{
                        transformStyle: "preserve-3d",
                      }}
                    >
                      <div className="mx-1 flex-1">
                        <div className="relative mt-1 aspect-[5/6] w-full overflow-hidden rounded-xl bg-black">
                          <img
                            loading="lazy"
                            className="absolute inset-0 h-full w-full object-cover contrast-75 saturate-50"
                            alt={`${module.title} background`}
                            src={module.image}
                            style={{
                              boxShadow: "rgba(0, 0, 0, 0.3) 0px 10px 30px 0px",
                              transform: "translateZ(50px)",
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                          <div className="absolute bottom-2 left-2 right-2 md:bottom-3 md:left-3 md:right-3" style={{ transform: "translateZ(75px)" }}>
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <div className="text-[#dc2626] scale-75 md:scale-100">{module.icon}</div>
                            </div>
                            <h4 className="text-white font-heading font-bold text-sm md:text-base mb-0.5 md:mb-1">
                              {module.title}
                            </h4>
                            <p className="text-gray-300 text-[10px] md:text-xs line-clamp-2">
                              {module.description}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-1 flex flex-shrink-0 items-center justify-between px-2 py-1.5 md:px-3 md:py-2 font-mono text-white">
                        <div className="text-[9px] md:text-[10px] font-semibold">SC Training</div>
                        <div className="text-[9px] md:text-[10px] text-[#dc2626] opacity-70">#{module.code}</div>
                      </div>
                    </button>
                  </Link>
                </CometCard>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[#262626] mt-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-[#a3a3a3] text-sm">
                © {new Date().getFullYear()} Spatial Collective. All rights reserved.
              </p>
              <div className="flex items-center gap-6">
                <a 
                  href="https://spatialcollective.co.ke" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#a3a3a3] hover:text-[#dc2626] transition-colors text-sm"
                >
                  Visit Our Website
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
