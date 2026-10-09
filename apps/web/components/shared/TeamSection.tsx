import Image from 'next/image';
import type { TeamMember } from '@/lib/team';
import { Reveal } from '@/components/ui/Reveal';
import { getServerMessages } from '@/lib/i18n';

/**
 * "Մեր թիմը" — the About page's team grid. Pixel-matched to Figma node
 * `123:366`/`123:370` (file `9Lq4XpWusTJj1VnM6laAZr`, verified via
 * get_design_context): a 4-up grid of 327×490 photo cards (12px column gap,
 * 24px row gap — a 4-column grid with a 12px gap divides the page's 1344px
 * content column into exactly 327px cards, so no per-card width is
 * hardcoded), each with a bottom-heavy dark gradient, bold name + regular
 * title caption bottom-left, and an optional LinkedIn icon bottom-right —
 * the icon only renders for people who have a link, same "field renders
 * nothing until an admin fills it in" contract as everywhere else on the
 * site. Renders nothing (not empty placeholder cards) when the admin
 * hasn't added anyone yet.
 */
export async function TeamSection({ members }: { members: TeamMember[] }) {
  if (members.length === 0) return null;
  const { messages } = await getServerMessages();

  return (
    <div>
      <h2 className="stretch-88 text-[28px] font-light leading-[38px] text-neutral-800 sm:text-home-h2 sm:leading-[58px]">
        {messages.about.team.heading}
      </h2>
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4 lg:gap-x-3 lg:gap-y-6">
        {members.map((member, index) => (
          <Reveal key={member.id} delayMs={(index % 4) * 100}>
            <TeamCard member={member} />
          </Reveal>
        ))}
      </div>
    </div>
  );
}

function TeamCard({ member }: { member: TeamMember }) {
  return (
    <div className="group relative aspect-[327/490] w-full overflow-hidden rounded-[32px] bg-neutral-800">
      {member.photoUrl && (
        <Image
          src={member.photoUrl}
          alt=""
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 ease-expo group-hover:scale-105"
        />
      )}
      {/* Figma's gradient: rgba(0,0,0,0) at 44.191% to rgb(0,0,0) at 99.939% —
          the top ~44% of the card stays untouched, then fades to black. */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/0 from-[44.191%] to-black to-[99.939%]"
        aria-hidden="true"
      />
      <div
        className="absolute flex flex-col gap-[2px]"
        style={{ left: '4.893%', top: '85.714%', width: '50.765%', transform: 'translateY(-16px)' }}
      >
        <p className="stretch-97 text-[16px] font-bold leading-[20px] text-white">{member.name}</p>
        <p className="stretch-97 pt-[5px] text-[16px] font-normal leading-[24px] text-white">
          {member.title}
        </p>
      </div>
      {member.linkedinUrl && (
        <a
          href={member.linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${member.name} — LinkedIn`}
          className="absolute transition-transform duration-standard ease-expo before:absolute before:left-1/2 before:top-1/2 before:size-11 before:-translate-x-1/2 before:-translate-y-1/2 before:content-[''] hover:scale-110"
          style={{ left: '85.627%', top: '87.347%', width: '9.480%', height: '6.327%' }}
        >
          <Image src="/icons/linkedin.svg" alt="" fill className="object-contain" />
        </a>
      )}
    </div>
  );
}
