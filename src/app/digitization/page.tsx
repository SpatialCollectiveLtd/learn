"use client";

import { BackgroundBeams } from "@/components/ui/background-beams";
import { CometCard } from "@/components/ui/comet-card";
import { FloatingHeader } from "@/components/ui/floating-header";
import { OsmUsernameNotification } from "@/components/notifications/OsmUsernameNotification";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconPencil, IconCircleCheck, IconMap } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { getYouthSession, getTrainingProgress } from "@/lib/youth-client";

export default function DigitizationPage() {
  const [mapperProgress, setMapperProgress] = useState<number[]>([]);
  const [validatorProgress, setValidatorProgress] = useState<number[]>([]);
  const router = useRouter();

  useEffect(() => {
    const session = getYouthSession();
    if (!session) {
      router.push('/');
      return;
    }

    // Staff should never land here
    if (session.userType === 'staff') {
      router.replace(session.role === 'admin' ? '/admin' : '/trainer');
      return;
    }

    // If the youth has a definite single module + assignment, redirect straight to it
    if (session.module === 'digitization') {
      const target = session.moduleAssignment === 'validator'
        ? '/digitization/validator'
        : '/digitization/mapper';
      router.replace(target);
      return;
    }

    // Load progress for the role selector cards
    getTrainingProgress(session.token).then((data) => {
      if (data?.progress) {
        setMapperProgress(data.progress.mapper ?? []);
        setValidatorProgress(data.progress.validator ?? []);
      }
    });
  }, [router]);

  const roles = [
    {
      title: "Mapper",
      description: "Learn digital mapping, building digitization, JOSM setup, and complete task workflows from start to finish.",
      link: "/digitization/mapper",
      icon: <IconPencil className="w-16 h-16" />,
      image: "https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?q=80&w=1000",
      code: "MAP1",
      totalSteps: 7,
      completedSteps: mapperProgress.length,
    },
    {
      title: "Validator",
      description: "Master data validation techniques, quality assurance processes, and ensure mapping accuracy and completeness.",
      link: "/digitization/validator",
      icon: <IconCircleCheck className="w-16 h-16" />,
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1000",
      code: "VAL2",
      totalSteps: 7,
      completedSteps: validatorProgress.length,
    },
  ];

  return (
    <main className="min-h-screen bg-black relative overflow-hidden">
      <BackgroundBeams className="opacity-30" />

      <FloatingHeader showBackButton backHref="/dashboard" />

      <div className="relative z-10 pt-20">
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
                      style={{ transformStyle: "preserve-3d" }}
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

                          {role.completedSteps > 0 && (
                            <div className="absolute top-2 right-2 bg-[#22c55e]/90 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1" style={{ transform: "translateZ(100px)" }}>
                              <CheckCircle2 className="w-3 h-3 text-white" />
                              <span className="text-[10px] font-semibold text-white">
                                {role.completedSteps}/{role.totalSteps}
                              </span>
                            </div>
                          )}

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

                            {role.completedSteps > 0 && (
                              <div className="mt-2 w-full bg-[#262626] rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-[#22c55e] h-full transition-all duration-500"
                                  style={{ width: `${(role.completedSteps / role.totalSteps) * 100}%` }}
                                />
                              </div>
                            )}
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

      <OsmUsernameNotification />
    </main>
  );
}
