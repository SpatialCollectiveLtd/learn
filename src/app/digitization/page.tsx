import { BackgroundBeams } from "@/components/ui/background-beams";
import { CometCard } from "@/components/ui/comet-card";
import { FloatingHeader } from "@/components/ui/floating-header";
import Link from "next/link";
import { IconPencil, IconCircleCheck, IconMap } from "@tabler/icons-react";

export default function DigitizationPage() {
  const roles = [
    {
      title: "Mapper",
      description: "Learn digital mapping, building digitization, JOSM setup, and complete task workflows from start to finish.",
      link: "/digitization/mapper",
      icon: <IconPencil className="w-16 h-16" />,
      image: "https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1287&auto=format&fit=crop",
      code: "MAP1",
    },
    {
      title: "Validator",
      description: "Master data validation techniques, quality assurance processes, and ensure mapping accuracy and completeness.",
      link: "/digitization/validator",
      icon: <IconCircleCheck className="w-16 h-16" />,
      image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1287&auto=format&fit=crop",
      code: "VAL2",
    },
  ];

  return (
    <main className="min-h-screen bg-black relative overflow-hidden">
      <BackgroundBeams className="opacity-30" />
      
      {/* Floating Header */}
      <FloatingHeader showBackButton backHref="/" />
      
      <div className="relative z-10 pt-20">
        {/* Content */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <div className="text-6xl mb-6 flex items-center justify-center">
              <IconMap className="w-20 h-20 text-[#dc2626]" />
            </div>
            <h2 className="text-4xl sm:text-5xl font-heading font-bold text-white mb-6">
              Digitization Training
            </h2>
            <p className="text-lg text-[#e5e5e5] max-w-2xl mx-auto">
              Master digital mapping and satellite image interpretation. Learn to use JOSM, HOT Tasking Manager, 
              and contribute to global mapping communities.
            </p>
          </div>

          <div className="max-w-3xl mx-auto px-4">
            <h3 className="text-xl sm:text-2xl font-subheading font-bold text-white mb-6 text-center">
              Select Your Role
            </h3>
            <div className="grid grid-cols-2 gap-4 md:gap-6">
              {roles.map((role, index) => (
                <CometCard key={index} rotateDepth={15} translateDepth={25}>
                  <Link href={role.link}>
                    <button
                      type="button"
                      className="flex w-full cursor-pointer flex-col items-stretch rounded-xl border-0 bg-[#1F2121] p-1.5 transition-all hover:bg-[#252727] md:p-2.5"
                      aria-label={`View ${role.title} training`}
                      style={{
                        transformStyle: "preserve-3d",
                      }}
                    >
                      <div className="mx-1 flex-1">
                        <div className="relative mt-1 aspect-[5/6] w-full overflow-hidden rounded-xl bg-black">
                          <img
                            loading="lazy"
                            className="absolute inset-0 h-full w-full object-cover contrast-75 saturate-50"
                            alt={`${role.title} background`}
                            src={role.image}
                            style={{
                              boxShadow: "rgba(0, 0, 0, 0.3) 0px 10px 30px 0px",
                              transform: "translateZ(50px)",
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                          <div className="absolute bottom-2 left-2 right-2 md:bottom-3 md:left-3 md:right-3" style={{ transform: "translateZ(75px)" }}>
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <div className="text-[#dc2626] scale-75 md:scale-100">{role.icon}</div>
                            </div>
                            <h4 className="text-white font-heading font-bold text-sm md:text-base mb-0.5 md:mb-1">
                              {role.title}
                            </h4>
                            <p className="text-gray-300 text-[10px] md:text-xs line-clamp-2">
                              {role.description}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-1 flex flex-shrink-0 items-center justify-between px-2 py-1.5 md:px-3 md:py-2 font-mono text-white">
                        <div className="text-[9px] md:text-[10px] font-semibold">Digitization</div>
                        <div className="text-[9px] md:text-[10px] text-[#dc2626] opacity-70">#{role.code}</div>
                      </div>
                    </button>
                  </Link>
                </CometCard>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
