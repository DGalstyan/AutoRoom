import Image from 'next/image';
import { LoadingImage } from '@/components/ui/LoadingImage';
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
      <h2 className="type-h2 text-neutral-800">{messages.about.team.heading}</h2>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-6 lg:mt-16 lg:grid-cols-4 lg:gap-x-3 lg:gap-y-6">
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
        <LoadingImage
          src={member.photoUrl}
          alt={member.name}
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
      {/* Phones: two narrow cards per row, so the text sits along the bottom edge at full card width.
          From `sm` up it returns to the design's exact position. */}
      <div
        className={`absolute inset-x-3 bottom-3 flex flex-col gap-[2px] sm:inset-x-auto sm:bottom-auto sm:left-[4.893%] sm:top-[85.714%] sm:w-[50.765%] sm:-translate-y-4 ${
          member.linkedinUrl ? 'max-sm:pr-9' : ''
        }`}
      >
        <p className="stretch-97 text-[16px] font-bold leading-[20px] text-white">{member.name}</p>
        <p className="type-body stretch-97 pt-[5px] text-[14px] leading-5 text-white sm:text-[length:inherit] sm:leading-[inherit]">
          {member.title}
        </p>
      </div>
      {member.linkedinUrl && (
        <a
          href={member.linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${member.name} — LinkedIn`}
          className="absolute bottom-3 right-3 size-6 transition-transform duration-standard ease-expo before:absolute before:left-1/2 before:top-1/2 before:size-11 before:-translate-x-1/2 before:-translate-y-1/2 before:content-[''] hover:scale-110 sm:bottom-auto sm:right-auto sm:left-[85.627%] sm:top-[87.347%] sm:h-[6.327%] sm:w-[9.480%]"
        >
          <Image src="/icons/linkedin.svg" alt="" fill className="object-contain" />
        </a>
      )}
    </div>
  );
}
