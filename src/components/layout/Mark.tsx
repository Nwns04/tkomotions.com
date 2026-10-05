import Image from 'next/image';
import Link from 'next/link';

type MarkProps = { footer?: boolean };

export function Mark({ footer = false }: MarkProps) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="TKO Motions, return to home">
      <Image
        src="/images/logo.png"
        alt="TKO Motions"
        width={128}
        height={60}
        priority={!footer}
        style={{ height: 'auto' }}
        className={`h-auto w-32 object-contain object-left ${footer ? 'brightness-0 invert' : ''}`}
      />
      <span className="grid gap-1 text-[10px] font-bold tracking-[0.08em]">
        TKO MOTIONS
        <small className={`block font-mono text-[7px] tracking-[0.08em] ${footer ? 'text-white/65' : 'text-kh-muted'}`}>
          BUSINESS INNOVATION
        </small>
      </span>
    </Link>
  );
}