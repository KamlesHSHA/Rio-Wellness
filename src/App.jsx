import { useState, useEffect, useRef, useCallback } from "react";

// ── Painterly Ocean Background ─────────────────────────────────────────────
// Clouds are rendered as soft blurred masses — feGaussianBlur dissolves hard
// edges so they look like watercolour washes against the sky, not cartoons.
const OceanBg = ({ variant = "day" }) => {

  // Each SoftCloud is a cluster of blurred ellipses composited together.
  // The trick: draw the shapes into a <g> with a blur filter applied to the group,
  // then overlay a slightly-less-blurred highlight on the upper portion.
  // Result: airy, diffuse, atmospheric — no hard outlines anywhere.
  const SoftCloud = ({ x, y, w = 200, h = 70, opacity = 0.82, tint = "white", blur = 18, id }) => {
    const shad = tint === "white" ? "#b8d4ee" : tint === "#FFF0E0" ? "#d4bfa0" : "#c0a080";
    return (
      <g opacity={opacity}>
        {/* shadow / base mass — heavily blurred, sits low */}
        <ellipse cx={x} cy={y + h * 0.38} rx={w * 0.52} ry={h * 0.38}
          fill={shad} filter={`url(#cb${id})`} opacity="0.55" />
        {/* main body */}
        <ellipse cx={x} cy={y} rx={w * 0.48} ry={h * 0.46}
          fill={tint} filter={`url(#cb${id})`} />
        {/* left lobe */}
        <ellipse cx={x - w * 0.32} cy={y + h * 0.08} rx={w * 0.3} ry={h * 0.38}
          fill={tint} filter={`url(#cb${id})`} />
        {/* right lobe */}
        <ellipse cx={x + w * 0.34} cy={y + h * 0.05} rx={w * 0.28} ry={h * 0.35}
          fill={tint} filter={`url(#cb${id})`} />
        {/* top crown — bright highlight, less blur */}
        <ellipse cx={x + w * 0.04} cy={y - h * 0.28} rx={w * 0.22} ry={h * 0.28}
          fill={tint} filter={`url(#ch${id})`} opacity="0.9" />
        {/* secondary top peak */}
        <ellipse cx={x - w * 0.18} cy={y - h * 0.18} rx={w * 0.16} ry={h * 0.22}
          fill={tint} filter={`url(#ch${id})`} opacity="0.8" />
      </g>
    );
  };

  // Wispy cirrus streak — just a very blurred elongated ellipse, barely visible
  const Wisp = ({ x, y, w, opacity, tint = "white", id }) => (
    <ellipse cx={x} cy={y} rx={w} ry={8}
      fill={tint} filter={`url(#cw${id})`} opacity={opacity} />
  );

  // Soft mountain ridge — slightly blurred so it dissolves into the horizon haze
  const Mountains = ({ y, fill, opacity, id }) => (
    <path
      d={`M0 ${y+80} C80 ${y+80} 100 ${y+10} 160 ${y-18} C220 ${y-46} 260 ${y+12} 320 ${y-38} C380 ${y-88} 430 ${y-8} 500 ${y-58} C570 ${y-108} 620 ${y-22} 680 ${y-44} C740 ${y-66} 800 ${y+8} 860 ${y-32} C920 ${y-72} 980 ${y-14} 1060 ${y-56} C1140 ${y-98} 1200 ${y-16} 1260 ${y-50} C1320 ${y-84} 1380 ${y-4} 1440 ${y+20} L1440 ${y+160} L0 ${y+160}Z`}
      fill={fill} opacity={opacity} filter={`url(#mf${id})`}
    />
  );

  // Build filter defs for each cloud (blur radius varies per cloud for variety)
  const cloudDefs = (ids, blurs, highlightBlurs, wispBlurs, mountainBlurs) => ids.map((id, i) => (
    <g key={id}>
      <filter id={`cb${id}`} x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation={blurs[i]} />
      </filter>
      <filter id={`ch${id}`} x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation={highlightBlurs[i]} />
      </filter>
      {i < wispBlurs.length && (
        <filter id={`cw${id}`} x="-40%" y="-200%" width="180%" height="500%">
          <feGaussianBlur stdDeviation={wispBlurs[i]} />
        </filter>
      )}
      {i < mountainBlurs.length && (
        <filter id={`mf${id}`} x="-5%" y="-20%" width="110%" height="140%">
          <feGaussianBlur stdDeviation={mountainBlurs[i]} />
        </filter>
      )}
    </g>
  ));

  // ── DAY ──────────────────────────────────────────────────────────────────
  if (variant === "day") return (
    <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice"
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 0 }}>
      <defs>
        <linearGradient id="sky-day" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#0B3C6D" />
          <stop offset="35%"  stopColor="#1e65b5" />
          <stop offset="68%"  stopColor="#4A90E2" />
          <stop offset="100%" stopColor="#82bef5" />
        </linearGradient>
        <linearGradient id="ocean-day" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#1a5fa8" />
          <stop offset="50%"  stopColor="#0d4080" />
          <stop offset="100%" stopColor="#041829" />
        </linearGradient>
        <linearGradient id="horizon-haze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#d0eaff" stopOpacity="0.38" />
          <stop offset="100%" stopColor="#d0eaff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="sun-glow-day" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#FFFBE8" stopOpacity="1" />
          <stop offset="35%"  stopColor="#FFE680" stopOpacity="0.7" />
          <stop offset="70%"  stopColor="#FFD740" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#FFD740" stopOpacity="0" />
        </radialGradient>
        <filter id="sun-blur-day" x="-80%" y="-80%" width="360%" height="360%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        {cloudDefs(
          ["d1","d2","d3","d4","d5","d6","d7","d8","d9"],
          [16, 14, 20, 15, 12, 10, 9, 11, 10],
          [8, 7, 10, 7, 6, 5, 5, 6, 5],
          [12, 10, 14],
          [2.5, 1.5]
        )}
      </defs>

      {/* Sky gradient */}
      <rect width="1440" height="900" fill="url(#sky-day)" />

      {/* Sun — pure bloom, no hard edge, dissolves into sky */}
      <circle cx="1080" cy="128" r="180" fill="#FFD740" opacity="0.04" />
      <circle cx="1080" cy="128" r="130" fill="#FFE060" opacity="0.07" />
      <circle cx="1080" cy="128" r="90"  fill="url(#sun-glow-day)" opacity="0.55" />
      <ellipse cx="1080" cy="128" rx="58" ry="56" fill="#FFFAE8" filter="url(#sun-blur-day)" opacity="0.82" />

      {/* Horizon atmospheric blush */}
      <rect x="0" y="420" width="1440" height="110" fill="url(#horizon-haze)" />

      {/* Mountains — soft, dreamlike */}
      <Mountains y={468} fill="#0a3060" opacity={0.28} id="d1" />
      <Mountains y={482} fill="#1a5090" opacity={0.16} id="d2" />

      {/* Wispy high cirrus */}
      <Wisp x={300}  y={52}  w={160} opacity={0.18} id="d1" />
      <Wisp x={820}  y={40}  w={130} opacity={0.14} id="d2" />
      <Wisp x={1250} y={62}  w={110} opacity={0.16} id="d3" />

      {/* Main painterly clouds — large, soft */}
      <SoftCloud x={155}  y={108} w={230} h={78}  opacity={0.78} id="d1" />
      <SoftCloud x={500}  y={78}  w={200} h={65}  opacity={0.72} id="d2" />
      <SoftCloud x={820}  y={115} w={270} h={88}  opacity={0.75} id="d3" />
      <SoftCloud x={1130} y={88}  w={210} h={70}  opacity={0.68} id="d4" />
      <SoftCloud x={1360} y={65}  w={170} h={58}  opacity={0.62} id="d5" />
      {/* Mid-distance smaller clouds — more transparent */}
      <SoftCloud x={330}  y={185} w={150} h={48}  opacity={0.42} id="d6" />
      <SoftCloud x={660}  y={200} w={130} h={42}  opacity={0.36} id="d7" />
      <SoftCloud x={970}  y={178} w={160} h={52}  opacity={0.40} id="d8" />
      <SoftCloud x={1290} y={195} w={120} h={40}  opacity={0.32} id="d9" />

      {/* Seabirds */}
      <g stroke="#cce4f7" strokeWidth="1.6" fill="none" opacity="0.5">
        <path d="M360 248 Q365 243 370 248" /><path d="M376 240 Q381 235 386 240" />
        <path d="M790 210 Q796 205 802 210" /><path d="M808 202 Q813 197 818 202" />
        <path d="M1170 228 Q1175 223 1180 228" /><path d="M1186 220 Q1191 215 1196 220" />
      </g>

      {/* Ocean */}
      <rect x="0" y="508" width="1440" height="392" fill="url(#ocean-day)" />
      <path d="M0 518 C140 509 300 526 480 516 C660 506 840 524 1020 514 C1200 504 1340 520 1440 512 L1440 540 L0 540Z" fill="#2d7dd2" opacity="0.48" />
      <path d="M0 572 C120 558 280 580 460 568 C640 556 820 578 1020 564 C1200 552 1360 572 1440 562 L1440 610 L0 610Z" fill="#1e65b5" opacity="0.62" />
      <path d="M0 632 C150 618 320 638 520 626 C720 614 920 634 1120 622 C1300 612 1400 628 1440 620 L1440 680 L0 680Z" fill="#174f96" opacity="0.72" />
      <path d="M0 702 C100 686 240 710 420 698 C600 686 780 710 960 698 C1140 686 1320 708 1440 698 L1440 900 L0 900Z" fill="#0d3b6e" opacity="0.9" />
      <path d="M0 702 C100 686 240 710 420 698 C600 686 780 710 960 698 C1140 686 1320 708 1440 698" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
      <path d="M80 697 Q96 693 112 697"     fill="none" stroke="white" strokeWidth="1.4" opacity="0.45" />
      <path d="M260 704 Q278 699 296 704"   fill="none" stroke="white" strokeWidth="1.4" opacity="0.4" />
      <path d="M530 695 Q548 691 566 695"   fill="none" stroke="white" strokeWidth="1.4" opacity="0.42" />
      <path d="M820 706 Q838 701 856 706"   fill="none" stroke="white" strokeWidth="1.4" opacity="0.38" />
      <path d="M1100 698 Q1118 693 1136 698" fill="none" stroke="white" strokeWidth="1.4" opacity="0.42" />
      <path d="M1360 703 Q1378 698 1396 703" fill="none" stroke="white" strokeWidth="1.4" opacity="0.38" />
      {/* Sun shimmer on water */}
      <ellipse cx="1080" cy="555" rx="100" ry="11" fill="#FFE680" opacity="0.09" />
      <ellipse cx="1080" cy="595" rx="62"  ry="7"  fill="#FFE680" opacity="0.06" />
      <ellipse cx="1080" cy="638" rx="38"  ry="5"  fill="#FFE680" opacity="0.05" />
    </svg>
  );

  // ── SUNSET ───────────────────────────────────────────────────────────────
  if (variant === "sunset") return (
    <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice"
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 0 }}>
      <defs>
        <linearGradient id="sky-sunset" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#0B1F3A" />
          <stop offset="28%"  stopColor="#1a3a6b" />
          <stop offset="55%"  stopColor="#3d5f98" />
          <stop offset="76%"  stopColor="#c86840" />
          <stop offset="100%" stopColor="#e8956a" />
        </linearGradient>
        <radialGradient id="sunset-spread" cx="50%" cy="88%" r="55%">
          <stop offset="0%"   stopColor="#FFD06A" stopOpacity="0.75" />
          <stop offset="45%"  stopColor="#E8601A" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#E8601A" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ocean-sunset" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#1a4a82" />
          <stop offset="100%" stopColor="#040e1a" />
        </linearGradient>
        {cloudDefs(
          ["s1","s2","s3","s4","s5","s6"],
          [18, 15, 16, 13, 11, 10],
          [9, 7, 8, 6, 5, 5],
          [14, 11],
          [2.5, 1.5]
        )}
      </defs>
      <rect width="1440" height="900" fill="url(#sky-sunset)" />
      <rect width="1440" height="900" fill="url(#sunset-spread)" />
      {/* Sun at horizon */}
      <circle cx="720" cy="492" r="54"  fill="#FFD06A" opacity="0.92" />
      <circle cx="720" cy="492" r="85"  fill="#FF9A3C" opacity="0.25" />
      <circle cx="720" cy="492" r="130" fill="#FF6820" opacity="0.1" />
      {/* Mountains silhouetted — dark and crisp against glow */}
      <Mountains y={468} fill="#080f20" opacity={0.72} id="s1" />
      <Mountains y={484} fill="#0c1a30" opacity={0.52} id="s2" />
      {/* Sunset clouds — warm peach/amber tints, very soft */}
      <SoftCloud x={160}  y={125} w={240} h={75}  opacity={0.58} tint="#F5C4A0" id="s1" />
      <SoftCloud x={530}  y={88}  w={220} h={68}  opacity={0.52} tint="#F0B080" id="s2" />
      <SoftCloud x={900}  y={108} w={200} h={65}  opacity={0.50} tint="#F5C4A0" id="s3" />
      <SoftCloud x={1220} y={92}  w={180} h={58}  opacity={0.46} tint="#EDA878" id="s4" />
      <SoftCloud x={340}  y={205} w={150} h={45}  opacity={0.32} tint="#E89870" id="s5" />
      <SoftCloud x={1060} y={192} w={140} h={42}  opacity={0.28} tint="#EDA878" id="s6" />
      <Wisp x={420} y={55} w={180} opacity={0.14} tint="#F5D0B0" id="s1" />
      <Wisp x={1050} y={48} w={140} opacity={0.12} tint="#F5D0B0" id="s2" />
      {/* Ocean */}
      <rect x="0" y="510" width="1440" height="390" fill="url(#ocean-sunset)" />
      <path d="M0 522 C220 512 440 532 720 520 C1000 508 1240 528 1440 518 L1440 546 L0 546Z" fill="#2255a0" opacity="0.48" />
      <path d="M0 590 C180 576 380 598 620 584 C860 570 1100 594 1320 580 C1390 576 1430 586 1440 582 L1440 628 L0 628Z" fill="#1a4080" opacity="0.58" />
      <path d="M0 678 C160 664 340 688 560 674 C780 660 1000 682 1220 670 C1360 662 1420 676 1440 670 L1440 900 L0 900Z" fill="#0e2a55" opacity="0.88" />
      <path d="M0 678 C160 664 340 688 560 674 C780 660 1000 682 1220 670 C1360 662 1420 676 1440 670" fill="none" stroke="rgba(255,200,80,0.22)" strokeWidth="2" />
      <ellipse cx="720" cy="534" rx="130" ry="10" fill="#FFD06A" opacity="0.2" />
      <ellipse cx="720" cy="574" rx="80"  ry="7"  fill="#FFD06A" opacity="0.13" />
      <ellipse cx="720" cy="616" rx="48"  ry="5"  fill="#FFD06A" opacity="0.08" />
    </svg>
  );

  // ── DAWN ─────────────────────────────────────────────────────────────────
  return (
    <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice"
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 0 }}>
      <defs>
        <linearGradient id="sky-dawn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#0B3C6D" />
          <stop offset="38%"  stopColor="#2563a8" />
          <stop offset="70%"  stopColor="#5fa8e8" />
          <stop offset="100%" stopColor="#D9ECFF" />
        </linearGradient>
        <linearGradient id="ocean-dawn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#1e5fa8" />
          <stop offset="100%" stopColor="#041829" />
        </linearGradient>
        <radialGradient id="dawn-bloom" cx="88%" cy="90%" r="48%">
          <stop offset="0%"   stopColor="#FFE8C0" stopOpacity="0.55" />
          <stop offset="50%"  stopColor="#FFD090" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#FFD090" stopOpacity="0" />
        </radialGradient>
        {cloudDefs(
          ["w1","w2","w3","w4","w5","w6","w7"],
          [16, 14, 18, 13, 12, 10, 9],
          [8, 7, 9, 6, 6, 5, 5],
          [12, 10, 10],
          [2.5, 1.5]
        )}
      </defs>
      <rect width="1440" height="900" fill="url(#sky-dawn)" />
      <rect width="1440" height="900" fill="url(#dawn-bloom)" />
      {/* Rising sun far-right, barely above horizon */}
      <circle cx="1310" cy="488" r="52"  fill="#FFF4D0" opacity="0.88" />
      <circle cx="1310" cy="488" r="90"  fill="#FFE090" opacity="0.2" />
      <circle cx="1310" cy="488" r="140" fill="#FFD060" opacity="0.08" />
      {/* Mountains */}
      <Mountains y={464} fill="#0B3C6D" opacity={0.30} id="w1" />
      <Mountains y={480} fill="#1a5fa8" opacity={0.18} id="w2" />
      {/* Wispy streaks high up */}
      <Wisp x={250}  y={50}  w={170} opacity={0.16} id="w1" />
      <Wisp x={780}  y={42}  w={140} opacity={0.13} id="w2" />
      <Wisp x={1200} y={58}  w={120} opacity={0.15} id="w3" />
      {/* Main clouds — white with faint warm tint on right side near sun */}
      <SoftCloud x={120}  y={105} w={220} h={72}  opacity={0.74} id="w1" />
      <SoftCloud x={460}  y={76}  w={195} h={62}  opacity={0.68} id="w2" />
      <SoftCloud x={780}  y={112} w={255} h={82}  opacity={0.72} id="w3" />
      <SoftCloud x={1100} y={84}  w={200} h={65}  opacity={0.62} tint="#FFF0E0" id="w4" />
      <SoftCloud x={1340} y={145} w={160} h={52}  opacity={0.50} tint="#FFE8C8" id="w5" />
      <SoftCloud x={295}  y={192} w={145} h={46}  opacity={0.38} id="w6" />
      <SoftCloud x={640}  y={205} w={125} h={40}  opacity={0.32} id="w7" />
      {/* Seabirds */}
      <g stroke="#cce4f7" strokeWidth="1.6" fill="none" opacity="0.48">
        <path d="M520 250 Q525 245 530 250" /><path d="M536 242 Q541 237 546 242" />
        <path d="M1060 228 Q1065 223 1070 228" /><path d="M1076 220 Q1081 215 1086 220" />
      </g>
      {/* Ocean */}
      <rect x="0" y="510" width="1440" height="390" fill="url(#ocean-dawn)" />
      <path d="M0 520 C160 511 340 528 560 518 C780 508 1000 526 1220 516 C1340 510 1410 520 1440 516 L1440 542 L0 542Z" fill="#2d7dd2" opacity="0.44" />
      <path d="M0 576 C140 562 300 584 500 572 C700 560 920 580 1120 568 C1300 558 1400 574 1440 566 L1440 618 L0 618Z" fill="#1a5fa8" opacity="0.58" />
      <path d="M0 682 C120 666 280 688 480 676 C680 664 900 684 1120 672 C1310 662 1410 678 1440 672 L1440 900 L0 900Z" fill="#0d3b6e" opacity="0.9" />
      <path d="M0 682 C120 666 280 688 480 676 C680 664 900 684 1120 672 C1310 662 1410 678 1440 672" fill="none" stroke="rgba(255,255,255,0.26)" strokeWidth="2" />
      <path d="M90 677 Q106 673 122 677"     fill="none" stroke="white" strokeWidth="1.4" opacity="0.42" />
      <path d="M360 684 Q378 679 396 684"    fill="none" stroke="white" strokeWidth="1.4" opacity="0.38" />
      <path d="M760 675 Q778 670 796 675"    fill="none" stroke="white" strokeWidth="1.4" opacity="0.42" />
      <path d="M1060 680 Q1078 675 1096 680" fill="none" stroke="white" strokeWidth="1.4" opacity="0.38" />
      {/* Dawn sun shimmer */}
      <ellipse cx="1310" cy="548" rx="110" ry="10" fill="#FFE090" opacity="0.1" />
      <ellipse cx="1310" cy="590" rx="68"  ry="7"  fill="#FFE090" opacity="0.07" />
    </svg>
  );


  // ── NIGHT ─────────────────────────────────────────────────────────────────
  if (variant === "night") return (
    <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice"
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 0 }}>
      <defs>
        <linearGradient id="sky-night" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#02060F" />
          <stop offset="30%"  stopColor="#060E20" />
          <stop offset="65%"  stopColor="#0B1E3A" />
          <stop offset="100%" stopColor="#0e2a4a" />
        </linearGradient>
        <linearGradient id="ocean-night" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#0a1e36" />
          <stop offset="50%"  stopColor="#060e1e" />
          <stop offset="100%" stopColor="#010508" />
        </linearGradient>
        <radialGradient id="moon-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#FFFEF5" stopOpacity="1" />
          <stop offset="30%"  stopColor="#E8F0FF" stopOpacity="0.6" />
          <stop offset="65%"  stopColor="#C0D0FF" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#8090CC" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="moonlight-water" cx="50%" cy="0%" r="100%">
          <stop offset="0%"   stopColor="#8BAEE8" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#8BAEE8" stopOpacity="0" />
        </radialGradient>
        <filter id="moon-soft" x="-60%" y="-60%" width="320%" height="320%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <filter id="star-blur" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="0.8" />
        </filter>
        <filter id="night-cloud-f" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="22" />
        </filter>
        <filter id="night-cloud-h" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="11" />
        </filter>
        <filter id="night-mtn" x="-5%" y="-20%" width="110%" height="140%">
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>

      {/* Deep night sky */}
      <rect width="1440" height="900" fill="url(#sky-night)" />

      {/* Stars — three sizes for depth */}
      {[
        [120,45],[280,90],[380,30],[520,68],[650,22],[740,80],[870,42],[950,75],[1080,28],[1190,60],[1320,38],[1400,82],
        [60,130],[200,155],[340,118],[480,145],[600,110],[720,160],[840,128],[990,148],[1130,115],[1260,138],[1390,152],
        [170,200],[310,185],[450,218],[590,192],[730,210],[900,188],[1050,205],[1200,195],[1370,215],
      ].map(([x,y], i) => (
        <circle key={`s${i}`} cx={x} cy={y} r={i % 5 === 0 ? 1.4 : i % 3 === 0 ? 1.0 : 0.7}
          fill="white" opacity={0.45 + (i % 7) * 0.07} filter="url(#star-blur)" />
      ))}

      {/* A few brighter star twinkles */}
      {[[200,58],[560,35],[960,52],[1280,70],[420,162],[1100,140]].map(([x,y],i) => (
        <circle key={`bs${i}`} cx={x} cy={y} r="1.8" fill="white" opacity="0.88" filter="url(#star-blur)" />
      ))}

      {/* Moon — crescent by overlapping two soft circles */}
      {/* Outer glow bloom */}
      <circle cx="320" cy="110" r="160" fill="url(#moon-glow)" opacity="0.35" />
      <circle cx="320" cy="110" r="100" fill="#C8D8F8" opacity="0.07" />
      {/* Moon disc — blurred so edge is soft */}
      <circle cx="320" cy="110" r="46" fill="#FFFEF5" filter="url(#moon-soft)" opacity="0.96" />
      {/* Crescent shadow — offset dark circle to create crescent shape */}
      <circle cx="340" cy="100" r="38" fill="#0a1428" filter="url(#moon-soft)" opacity="0.88" />

      {/* Night clouds — very dark, barely visible, heavy blur */}
      {/* Main large masses */}
      <g opacity="0.55">
        <ellipse cx="680" cy="95"  rx="200" ry="62" fill="#1a2a44" filter="url(#night-cloud-f)" />
        <ellipse cx="580" cy="88"  rx="130" ry="48" fill="#1e3050" filter="url(#night-cloud-h)" />
        <ellipse cx="760" cy="82"  rx="110" ry="42" fill="#1e3050" filter="url(#night-cloud-h)" />
      </g>
      <g opacity="0.42">
        <ellipse cx="1150" cy="120" rx="180" ry="55" fill="#152238" filter="url(#night-cloud-f)" />
        <ellipse cx="1060" cy="112" rx="110" ry="42" fill="#1a2a44" filter="url(#night-cloud-h)" />
      </g>
      <g opacity="0.35">
        <ellipse cx="100"  cy="160" rx="140" ry="45" fill="#1a2a44" filter="url(#night-cloud-f)" />
        <ellipse cx="180"  cy="150" rx="90"  ry="35" fill="#1e3050" filter="url(#night-cloud-h)" />
      </g>

      {/* Mountains — midnight silhouettes, dark and still */}
      <path d="M0 548 C80 548 100 480 160 452 C220 424 260 472 320 440 C380 408 430 468 500 430 C570 392 620 438 680 414 C740 390 800 468 860 428 C920 388 980 446 1060 408 C1140 370 1200 434 1260 400 C1320 366 1380 444 1440 470 L1440 580 L0 580Z"
        fill="#070f1e" opacity="0.95" filter="url(#night-mtn)" />
      <path d="M0 562 C80 562 120 505 200 485 C280 465 340 498 420 478 C500 458 560 490 640 472 C720 454 800 488 880 468 C960 448 1040 478 1140 460 C1240 442 1330 472 1440 488 L1440 590 L0 590Z"
        fill="#04080f" opacity="0.9" filter="url(#night-mtn)" />

      {/* Moonlight shimmer column on water */}
      <ellipse cx="320" cy="560" rx="55"  ry="9"   fill="#8BAEE8" opacity="0.22" />
      <ellipse cx="320" cy="600" rx="80"  ry="10"  fill="#8BAEE8" opacity="0.16" />
      <ellipse cx="320" cy="645" rx="110" ry="12"  fill="#8BAEE8" opacity="0.12" />
      <ellipse cx="320" cy="695" rx="145" ry="14"  fill="#8BAEE8" opacity="0.08" />
      <ellipse cx="320" cy="750" rx="170" ry="16"  fill="#8BAEE8" opacity="0.05" />

      {/* Ocean — dark midnight */}
      <rect x="0" y="520" width="1440" height="380" fill="url(#ocean-night)" />
      <rect x="0" y="520" width="1440" height="380" fill="url(#moonlight-water)" />

      {/* Wave layers — subtle, dark blue */}
      <path d="M0 534 C180 524 380 542 600 530 C820 518 1060 538 1280 526 C1380 520 1430 530 1440 526 L1440 554 L0 554Z"
        fill="#102040" opacity="0.6" />
      <path d="M0 596 C160 582 360 602 580 590 C800 578 1040 598 1260 585 C1370 579 1430 590 1440 586 L1440 636 L0 636Z"
        fill="#0c1a30" opacity="0.7" />
      <path d="M0 682 C140 668 320 690 540 676 C760 662 980 684 1200 670 C1360 660 1420 676 1440 670 L1440 900 L0 900Z"
        fill="#060d1a" opacity="0.92" />
      {/* Wave foam — very faint silver-blue */}
      <path d="M0 682 C140 668 320 690 540 676 C760 662 980 684 1200 670 C1360 660 1420 676 1440 670"
        fill="none" stroke="rgba(140,170,220,0.2)" strokeWidth="1.5" />
      <path d="M90 677 Q108 673 126 677"    fill="none" stroke="rgba(180,210,240,0.25)" strokeWidth="1.2" />
      <path d="M400 684 Q418 679 436 684"   fill="none" stroke="rgba(180,210,240,0.2)"  strokeWidth="1.2" />
      <path d="M820 676 Q838 671 856 676"   fill="none" stroke="rgba(180,210,240,0.22)" strokeWidth="1.2" />
      <path d="M1150 681 Q1168 676 1186 681" fill="none" stroke="rgba(180,210,240,0.2)" strokeWidth="1.2" />
    </svg>
  );

  return null;
};
const WaveLogo = ({ size = 32, color = "white" }) => (
  <svg width={size} height={size * 0.6} viewBox="0 0 48 28" fill="none">
    <path d="M2 20 C8 8 16 4 24 12 C32 20 40 16 46 8" stroke={color} strokeWidth="3.5" strokeLinecap="round" fill="none" />
    <path d="M2 26 C10 16 18 12 26 18 C34 24 42 20 46 14" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.6" />
  </svg>
);

// ── Glass Card ─────────────────────────────────────────────────────────────
const Glass = ({ children, style = {}, className = "", onClick }) => (
  <div
    onClick={onClick}
    className={className}
    style={{
      background: "rgba(255,255,255,0.12)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      border: "1px solid rgba(255,255,255,0.25)",
      borderRadius: 20,
      ...style,
    }}
  >
    {children}
  </div>
);

// ── Mood emojis ────────────────────────────────────────────────────────────
const MOODS = [
  { label: "Very Sad", emoji: "😢", value: 1, color: "#5B8DD9" },
  { label: "Sad", emoji: "😔", value: 2, color: "#7BA7E0" },
  { label: "Neutral", emoji: "😐", value: 3, color: "#A8C4E8" },
  { label: "Happy", emoji: "😊", value: 4, color: "#6DB8D4" },
  { label: "Very Happy", emoji: "😄", value: 5, color: "#4A90E2" },
];

const CHALLENGES = ["Anxiety", "Stress", "Overthinking", "Relationships", "Burnout", "Sleep Issues", "Low Motivation", "Self Confidence"];

const SUGGESTED_PROMPTS = [
  "I'm feeling stressed today",
  "I feel anxious and can't focus",
  "I need some motivation",
  "I can't sleep well lately",
  "I had a really difficult day",
];

// ── Main App ───────────────────────────────────────────────────────────────
export default function RioApp() {
  const [page, setPage] = useState("landing");
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [moodEntries, setMoodEntries] = useState([
    { date: "2025-06-18", mood: 4, energy: 3, stress: 2, sleep: 4, reflection: "Had a good morning walk." },
    { date: "2025-06-19", mood: 3, energy: 2, stress: 4, sleep: 3, reflection: "Work was heavy today." },
    { date: "2025-06-20", mood: 5, energy: 4, stress: 2, sleep: 5, reflection: "Spent time with friends." },
    { date: "2025-06-21", mood: 2, energy: 2, stress: 5, sleep: 2, reflection: "Anxious about deadlines." },
    { date: "2025-06-22", mood: 4, energy: 3, stress: 3, sleep: 4, reflection: "Meditated in the morning." },
    { date: "2025-06-23", mood: 4, energy: 4, stress: 2, sleep: 4, reflection: "Productive and calm." },
  ]);
  const [journalEntries, setJournalEntries] = useState([
    { id: 1, title: "Finding peace in small moments", content: "Today I noticed the way sunlight filtered through the leaves. It reminded me that beauty exists even in the most ordinary moments...", date: "2025-06-23" },
    { id: 2, title: "Working through anxiety", content: "I've been feeling overwhelmed lately. Writing this out helps me see that my fears are often bigger in my mind than in reality...", date: "2025-06-21" },
  ]);
  const [chatMessages, setChatMessages] = useState([
    { role: "assistant", content: "Hello! I'm Rio, your wellness companion 🌊 How are you feeling today? I'm here to listen, support, and help you navigate whatever you're experiencing." }
  ]);
  const [activeNav, setActiveNav] = useState("home");

  const navigate = (p) => { setPage(p); };
  const switchTab = (navId) => { setPage("dashboard"); setActiveNav(navId); };

  const pages = {
    landing: <LandingPage onNavigate={navigate} />,
    signup: <SignupPage onNavigate={navigate} onSignup={setUser} />,
    login: <LoginPage onNavigate={navigate} onLogin={(u) => { setUser(u); setActiveNav("home"); setPage("dashboard"); }} />,
    onboarding: <OnboardingPage onNavigate={navigate} user={user} onUpdate={setUser} />,
    challenges: <ChallengesPage onNavigate={navigate} user={user} onUpdate={(u) => { setUser(u); setActiveNav("home"); setPage("dashboard"); }} />,
    dashboard: (
      <AppShell activeNav={activeNav} onNav={switchTab} user={user} darkMode={darkMode}>
        {activeNav === "home" && <DashboardHome user={user} moodEntries={moodEntries} journalEntries={journalEntries} onNavigate={navigate} setActiveNav={switchTab} />}
        {activeNav === "today" && <DailyCheckIn user={user} onSave={(e) => { setMoodEntries(prev => [...prev, e]); switchTab("home"); }} />}
        {activeNav === "journal" && <JournalPage user={user} entries={journalEntries} setEntries={setJournalEntries} />}
        {activeNav === "analytics" && <AnalyticsPage moodEntries={moodEntries} journalEntries={journalEntries} />}
        {activeNav === "anchor" && <AnchorPage />}
        {activeNav === "chat" && <ChatPage user={user} messages={chatMessages} setMessages={setChatMessages} />}
        {activeNav === "settings" && <SettingsPage user={user} darkMode={darkMode} setDarkMode={setDarkMode} onLogout={() => { setUser(null); setPage("landing"); }} />}
      </AppShell>
    ),
  };

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", minHeight: "100vh", overflow: "hidden" }}>
      {pages[page] || pages.landing}
    </div>
  );
}

// ── LANDING PAGE ───────────────────────────────────────────────────────────
function LandingPage({ onNavigate }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const el = document.getElementById("rio-landing");
    const fn = () => setScrolled(el?.scrollTop > 60);
    el?.addEventListener("scroll", fn);
    return () => el?.removeEventListener("scroll", fn);
  }, []);

  return (
    <div id="rio-landing" style={{ position: "relative", height: "100vh", overflowY: "auto" }}>
      <OceanBg variant="day" />

      {/* Navbar */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: scrolled ? "rgba(11,60,109,0.92)" : "rgba(11,40,85,0.55)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.1)" : "none",
        transition: "background 0.35s, border-color 0.35s",
        padding: "16px 40px", display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <WaveLogo size={28} />
          <span style={{ color: "white", fontSize: 22, fontWeight: 700, letterSpacing: -0.5 }}>Rio</span>
        </div>
        <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
          {["Home", "Features", "About"].map(n => (
            <a key={n} style={{ color: "rgba(255,255,255,0.85)", textDecoration: "none", fontSize: 14, cursor: "pointer" }}>{n}</a>
          ))}
          <button onClick={() => onNavigate("login")} style={{ ...btnOutline, padding: "8px 20px" }}>Sign In</button>
          <button onClick={() => onNavigate("signup")} style={{ ...btnPrimary, padding: "8px 20px" }}>Sign Up</button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "120px 20px 80px" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <WaveLogo size={56} />
        </div>
        <h1 style={{ color: "white", fontSize: "clamp(48px, 7vw, 80px)", fontWeight: 800, margin: "0 0 20px", lineHeight: 1.1, letterSpacing: -2 }}>
          Talk With Rio
        </h1>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "clamp(16px, 2vw, 20px)", maxWidth: 560, margin: "0 auto 40px", lineHeight: 1.7 }}>
          Your AI-powered mental wellness companion designed to help you understand emotions, reflect on your thoughts, and build healthier habits.
        </p>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, letterSpacing: 2, textTransform: "uppercase", marginBottom: 32 }}>
          Navigate Your Emotions, One Tide At A Time
        </p>
        <button onClick={() => onNavigate("signup")} style={{ ...btnPrimary, fontSize: 17, padding: "16px 44px", borderRadius: 50 }}>
          Start Journey →
        </button>
      </div>

      {/* Feature Cards */}
      <div style={{ position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, maxWidth: 960, margin: "0 auto", padding: "0 24px 80px" }}>
        {[
          { icon: "😊", title: "Mood Tracking", desc: "Log your emotions daily and discover patterns that shape your wellbeing." },
          { icon: "🤖", title: "AI Chat", desc: "Talk to Rio anytime — compassionate, judgment-free conversations 24/7." },
          { icon: "📔", title: "Journaling", desc: "A safe harbour to write your thoughts, feelings, and reflections." },
          { icon: "⚓", title: "Grounding Exercises", desc: "Breathing techniques and mindfulness practices to anchor you in the moment." },
        ].map(f => (
          <Glass key={f.title} style={{ padding: "28px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>{f.icon}</div>
            <h3 style={{ color: "white", margin: "0 0 8px", fontSize: 16, fontWeight: 700 }}>{f.title}</h3>
            <p style={{ color: "rgba(255,255,255,0.7)", margin: 0, fontSize: 13, lineHeight: 1.6 }}>{f.desc}</p>
          </Glass>
        ))}
      </div>

      {/* Footer */}
      <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "24px", borderTop: "1px solid rgba(255,255,255,0.15)" }}>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, margin: 0 }}>© 2025 Rio Wellness · Navigate Your Emotions, One Tide At A Time</p>
      </div>
    </div>
  );
}

// ── AUTH PAGES ─────────────────────────────────────────────────────────────
function SignupPage({ onNavigate, onSignup }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [err, setErr] = useState("");
  const submit = () => {
    if (!form.name || !form.email || !form.password) return setErr("Please fill all fields.");
    if (form.password !== form.confirm) return setErr("Passwords don't match.");
    onSignup({ name: form.name, email: form.email, nickname: form.name.split(" ")[0], challenges: [] });
    onNavigate("onboarding");
  };
  return (
    <AuthLayout title="Create your account" sub="Begin your wellness journey with Rio" variant="dawn">
      {err && <div style={{ background: "rgba(255,80,80,0.2)", border: "1px solid rgba(255,80,80,0.4)", borderRadius: 10, padding: "10px 14px", color: "white", fontSize: 13, marginBottom: 16 }}>{err}</div>}
      {[["Full Name", "name", "text"], ["Email", "email", "email"], ["Password", "password", "password"], ["Confirm Password", "confirm", "password"]].map(([label, key, type]) => (
        <AuthField key={key} label={label} type={type} value={form[key]} onChange={v => setForm(p => ({ ...p, [key]: v }))} />
      ))}
      <button onClick={submit} style={{ ...btnPrimary, width: "100%", padding: "14px", fontSize: 15, borderRadius: 12, marginTop: 8 }}>Sign Up</button>
      <div style={{ textAlign: "center", marginTop: 16 }}>
        <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>Already have an account? </span>
        <span onClick={() => onNavigate("login")} style={{ color: "#D9ECFF", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>Sign In</span>
      </div>
    </AuthLayout>
  );
}

function LoginPage({ onNavigate, onLogin }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const submit = () => {
    onLogin({ name: "Ocean Wanderer", email: form.email, nickname: "Friend", challenges: ["Stress", "Anxiety"] });
    onNavigate("dashboard", "home");
  };
  return (
    <AuthLayout title="Welcome back" sub="The ocean is waiting for you" variant="sunset">
      {[["Email", "email", "email"], ["Password", "password", "password"]].map(([label, key, type]) => (
        <AuthField key={key} label={label} type={type} value={form[key]} onChange={v => setForm(p => ({ ...p, [key]: v }))} />
      ))}
      <button onClick={submit} style={{ ...btnPrimary, width: "100%", padding: "14px", fontSize: 15, borderRadius: 12, marginTop: 8 }}>Sign In</button>
      <div style={{ textAlign: "center", marginTop: 16 }}>
        <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>New to Rio? </span>
        <span onClick={() => onNavigate("signup")} style={{ color: "#D9ECFF", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}>Create account</span>
      </div>
    </AuthLayout>
  );
}

function AuthLayout({ children, title, sub, variant }) {
  return (
    <div style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <OceanBg variant={variant} />
      <Glass style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 420, padding: "48px 40px", margin: 20 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <WaveLogo size={36} />
          <h2 style={{ color: "white", margin: "16px 0 6px", fontSize: 24, fontWeight: 700 }}>{title}</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: 14 }}>{sub}</p>
        </div>
        {children}
      </Glass>
    </div>
  );
}

function AuthField({ label, type, value, onChange }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, display: "block", marginBottom: 6 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.3)",
          background: "rgba(255,255,255,0.1)", color: "white", fontSize: 14, outline: "none", boxSizing: "border-box"
        }}
      />
    </div>
  );
}

// ── ONBOARDING ─────────────────────────────────────────────────────────────
function OnboardingPage({ onNavigate, user, onUpdate }) {
  const [name, setName] = useState(user?.name?.split(" ")[0] || "");
  return (
    <div style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <OceanBg variant="dawn" />
      <Glass style={{ position: "relative", zIndex: 1, maxWidth: 480, width: "100%", padding: "60px 48px", margin: 20, textAlign: "center" }}>
        <WaveLogo size={40} />
        <div style={{ fontSize: 48, margin: "20px 0 8px" }}>👋</div>
        <h2 style={{ color: "white", fontSize: 26, fontWeight: 700, margin: "0 0 12px" }}>What should Rio call you?</h2>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 15, marginBottom: 32, lineHeight: 1.6 }}>
          Choose a name you feel comfortable with — it can be your first name, a nickname, or anything that feels like you.
        </p>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Your preferred name"
          style={{
            width: "100%", padding: "14px 18px", borderRadius: 12, border: "1.5px solid rgba(255,255,255,0.35)",
            background: "rgba(255,255,255,0.12)", color: "white", fontSize: 16, textAlign: "center",
            outline: "none", boxSizing: "border-box", marginBottom: 24
          }}
        />
        <button
          onClick={() => { onUpdate(u => ({ ...u, nickname: name || u?.name?.split(" ")[0] || "Friend" })); onNavigate("challenges"); }}
          style={{ ...btnPrimary, width: "100%", padding: "14px", fontSize: 15, borderRadius: 12 }}
        >
          Continue →
        </button>
      </Glass>
    </div>
  );
}

// ── CHALLENGES ─────────────────────────────────────────────────────────────
function ChallengesPage({ onNavigate, user, onUpdate }) {
  const [selected, setSelected] = useState([]);
  const toggle = (c) => setSelected(p => p.includes(c) ? p.filter(x => x !== c) : [...p, c]);
  return (
    <div style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <OceanBg variant="day" />
      <Glass style={{ position: "relative", zIndex: 1, maxWidth: 560, width: "100%", padding: "48px 40px", margin: 20 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h2 style={{ color: "white", fontSize: 24, fontWeight: 700, margin: "0 0 10px" }}>What brings you to Rio?</h2>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 14, margin: 0 }}>Select all that resonate — this helps personalize your experience.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
          {CHALLENGES.map(c => (
            <div
              key={c}
              onClick={() => toggle(c)}
              style={{
                padding: "14px 16px", borderRadius: 12, cursor: "pointer",
                border: selected.includes(c) ? "2px solid #4A90E2" : "1.5px solid rgba(255,255,255,0.25)",
                background: selected.includes(c) ? "rgba(74,144,226,0.3)" : "rgba(255,255,255,0.08)",
                color: "white", fontSize: 14, fontWeight: selected.includes(c) ? 600 : 400,
                transition: "all 0.2s", textAlign: "center"
              }}
            >
              {c}
            </div>
          ))}
        </div>
        <button
          onClick={() => { onUpdate(u => ({ ...u, challenges: selected })); onNavigate("dashboard", "home"); }}
          disabled={selected.length === 0}
          style={{ ...btnPrimary, width: "100%", padding: "14px", fontSize: 15, borderRadius: 12, opacity: selected.length === 0 ? 0.5 : 1 }}
        >
          Begin My Journey →
        </button>
      </Glass>
    </div>
  );
}

// ── APP SHELL (Dashboard Layout) ───────────────────────────────────────────
function AppShell({ children, activeNav, onNav, user, darkMode }) {
  const navItems = [
    { id: "home", icon: "🏠", label: "Home" },
    { id: "today", icon: "☀️", label: "Today" },
    { id: "journal", icon: "📔", label: "Journal" },
    { id: "analytics", icon: "📊", label: "Analytics" },
    { id: "anchor", icon: "⚓", label: "Anchor" },
    { id: "chat", icon: "💬", label: "Chat" },
    { id: "settings", icon: "⚙️", label: "Settings" },
  ];
  return (
    <div style={{ position: "relative", minHeight: "100vh", display: "flex" }}>
      <OceanBg variant={darkMode ? "night" : "day"} />
      {/* Sidebar */}
      <Glass style={{ position: "fixed", left: 16, top: 16, bottom: 16, width: 220, borderRadius: 20, zIndex: 50, display: "flex", flexDirection: "column", padding: "24px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 32, paddingLeft: 8 }}>
          <WaveLogo size={24} />
          <span style={{ color: "white", fontWeight: 700, fontSize: 20 }}>Rio</span>
        </div>
        <div style={{ flex: 1 }}>
          {navItems.map(item => (
            <div
              key={item.id}
              onClick={() => onNav(item.id)}
              style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 12px",
                borderRadius: 12, cursor: "pointer", marginBottom: 4,
                background: activeNav === item.id ? "rgba(255,255,255,0.2)" : "transparent",
                color: activeNav === item.id ? "white" : "rgba(255,255,255,0.65)",
                fontWeight: activeNav === item.id ? 600 : 400,
                fontSize: 14, transition: "all 0.2s"
              }}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              {item.label}
            </div>
          ))}
        </div>
        <div style={{ paddingLeft: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(74,144,226,0.6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "white", fontWeight: 700 }}>
            {user?.nickname?.[0] || "U"}
          </div>
        </div>
      </Glass>
      {/* Main */}
      <div style={{ marginLeft: 252, flex: 1, padding: "24px 24px 24px 0", overflowY: "auto", position: "relative", zIndex: 1, minHeight: "100vh" }}>
        {children}
      </div>
    </div>
  );
}

// ── DASHBOARD HOME ─────────────────────────────────────────────────────────
function DashboardHome({ user, moodEntries, journalEntries, onNavigate, setActiveNav }) {
  const latest = moodEntries[moodEntries.length - 1];
  const streak = 6;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const moodObj = MOODS.find(m => m.value === latest?.mood) || MOODS[2];

  return (
    <div>
      {/* Welcome */}
      <Glass style={{ padding: "28px 32px", marginBottom: 20 }}>
        <h2 style={{ color: "white", margin: "0 0 6px", fontSize: 26, fontWeight: 700 }}>{greeting}, {user?.nickname || "Friend"} 🌊</h2>
        <p style={{ color: "rgba(255,255,255,0.7)", margin: 0, fontSize: 14 }}>How are the waters of your mind today?</p>
      </Glass>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
        <Glass style={{ padding: "20px 24px" }}>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginBottom: 8 }}>CURRENT MOOD</div>
          <div style={{ fontSize: 36 }}>{moodObj.emoji}</div>
          <div style={{ color: "white", fontSize: 14, fontWeight: 600, marginTop: 4 }}>{moodObj.label}</div>
        </Glass>
        <Glass style={{ padding: "20px 24px" }}>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginBottom: 8 }}>CURRENT STREAK</div>
          <div style={{ color: "white", fontSize: 40, fontWeight: 700, lineHeight: 1 }}>{streak}</div>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 4 }}>days 🔥</div>
        </Glass>
        <Glass style={{ padding: "20px 24px" }}>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginBottom: 8 }}>JOURNAL ENTRIES</div>
          <div style={{ color: "white", fontSize: 40, fontWeight: 700, lineHeight: 1 }}>{journalEntries.length}</div>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 4 }}>this month</div>
        </Glass>
      </div>

      {/* Latest journal */}
      {journalEntries[0] && (
        <Glass style={{ padding: "24px 28px", marginBottom: 20 }}>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginBottom: 12 }}>LATEST JOURNAL ENTRY</div>
          <h3 style={{ color: "white", margin: "0 0 8px", fontSize: 16, fontWeight: 600 }}>{journalEntries[0].title}</h3>
          <p style={{ color: "rgba(255,255,255,0.65)", margin: "0 0 12px", fontSize: 13, lineHeight: 1.6 }}>{journalEntries[0].content.slice(0, 120)}...</p>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{journalEntries[0].date}</span>
        </Glass>
      )}

      {/* Quick Actions */}
      <Glass style={{ padding: "24px 28px" }}>
        <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginBottom: 16 }}>QUICK ACTIONS</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { icon: "☀️", label: "Daily Check-In", nav: "today" },
            { icon: "💬", label: "Chat with Rio", nav: "chat" },
            { icon: "📔", label: "New Journal Entry", nav: "journal" },
            { icon: "⚓", label: "Grounding Exercise", nav: "anchor" },
          ].map(a => (
            <button
              key={a.label}
              onClick={() => setActiveNav(a.nav)}
              style={{
                ...btnOutline, padding: "14px", fontSize: 14, borderRadius: 12, display: "flex", alignItems: "center",
                gap: 10, justifyContent: "flex-start", background: "rgba(255,255,255,0.08)", width: "100%"
              }}
            >
              <span style={{ fontSize: 20 }}>{a.icon}</span> {a.label}
            </button>
          ))}
        </div>
      </Glass>
    </div>
  );
}

// ── DAILY CHECK-IN ─────────────────────────────────────────────────────────
function DailyCheckIn({ user, onSave }) {
  const [form, setForm] = useState({ mood: 3, energy: 3, stress: 3, sleep: 3, reflection: "" });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div>
      <Glass style={{ padding: "28px 32px", marginBottom: 20 }}>
        <h2 style={{ color: "white", margin: "0 0 4px", fontSize: 22, fontWeight: 700 }}>Daily Check-In ☀️</h2>
        <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: 14 }}>A moment to reflect on how you're doing today</p>
      </Glass>

      <Glass style={{ padding: "28px 32px", marginBottom: 20 }}>
        <h3 style={{ color: "white", margin: "0 0 20px", fontSize: 16, fontWeight: 600 }}>How are you feeling right now?</h3>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          {MOODS.map(m => (
            <div
              key={m.value}
              onClick={() => set("mood", m.value)}
              style={{
                textAlign: "center", cursor: "pointer", padding: "12px 16px", borderRadius: 14,
                border: form.mood === m.value ? "2px solid #4A90E2" : "1.5px solid rgba(255,255,255,0.2)",
                background: form.mood === m.value ? "rgba(74,144,226,0.3)" : "rgba(255,255,255,0.06)",
                transition: "all 0.2s", flex: 1
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 4 }}>{m.emoji}</div>
              <div style={{ color: "white", fontSize: 10 }}>{m.label}</div>
            </div>
          ))}
        </div>
      </Glass>

      {[
        { key: "energy", label: "Energy Level", emoji: "⚡", desc: ["Drained", "Low", "Moderate", "Good", "Energized"] },
        { key: "stress", label: "Stress Level", emoji: "🌊", desc: ["None", "Mild", "Moderate", "High", "Very High"] },
        { key: "sleep", label: "Sleep Quality", emoji: "🌙", desc: ["Terrible", "Poor", "Okay", "Good", "Excellent"] },
      ].map(({ key, label, emoji, desc }) => (
        <Glass key={key} style={{ padding: "24px 28px", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ color: "white", margin: 0, fontSize: 15, fontWeight: 600 }}>{emoji} {label}</h3>
            <span style={{ color: "#D9ECFF", fontSize: 14, fontWeight: 600 }}>{desc[form[key] - 1]}</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {[1, 2, 3, 4, 5].map(v => (
              <div
                key={v}
                onClick={() => set(key, v)}
                style={{
                  flex: 1, height: 8, borderRadius: 4, cursor: "pointer",
                  background: v <= form[key] ? "#4A90E2" : "rgba(255,255,255,0.2)",
                  transition: "background 0.2s"
                }}
              />
            ))}
          </div>
        </Glass>
      ))}

      <Glass style={{ padding: "24px 28px", marginBottom: 20 }}>
        <h3 style={{ color: "white", margin: "0 0 12px", fontSize: 15, fontWeight: 600 }}>📝 Reflection Notes</h3>
        <textarea
          value={form.reflection}
          onChange={e => set("reflection", e.target.value)}
          placeholder="What's on your mind? What happened today that's worth noting?"
          style={{
            width: "100%", height: 120, padding: "12px 14px", borderRadius: 10,
            border: "1.5px solid rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.08)",
            color: "white", fontSize: 14, resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.6
          }}
        />
      </Glass>

      <button
        onClick={() => onSave({ ...form, date: new Date().toISOString().split("T")[0] })}
        style={{ ...btnPrimary, width: "100%", padding: "14px", fontSize: 15, borderRadius: 12 }}
      >
        Save Check-In 🌊
      </button>
    </div>
  );
}

// ── JOURNAL PAGE ───────────────────────────────────────────────────────────
function JournalPage({ user, entries, setEntries }) {
  const [view, setView] = useState("list");
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ title: "", content: "" });

  const filtered = entries.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.content.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => { setEditing(null); setForm({ title: "", content: "" }); setView("edit"); };
  const openEdit = (e) => { setEditing(e); setForm({ title: e.title, content: e.content }); setView("edit"); };
  const save = () => {
    if (!form.title.trim()) return;
    if (editing) {
      setEntries(prev => prev.map(e => e.id === editing.id ? { ...e, ...form } : e));
    } else {
      setEntries(prev => [{ id: Date.now(), ...form, date: new Date().toISOString().split("T")[0] }, ...prev]);
    }
    setView("list");
  };
  const del = (id) => setEntries(prev => prev.filter(e => e.id !== id));

  if (view === "edit") return (
    <div>
      <Glass style={{ padding: "28px 32px", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => setView("list")} style={{ ...btnOutline, padding: "8px 16px", fontSize: 13 }}>← Back</button>
          <h2 style={{ color: "white", margin: 0, fontSize: 22, fontWeight: 700 }}>{editing ? "Edit Entry" : "New Entry"} 📔</h2>
        </div>
      </Glass>
      <Glass style={{ padding: "28px 32px" }}>
        <input
          value={form.title}
          onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
          placeholder="Entry title..."
          style={{
            width: "100%", padding: "14px 16px", borderRadius: 10, border: "1.5px solid rgba(255,255,255,0.25)",
            background: "rgba(255,255,255,0.08)", color: "white", fontSize: 18, fontWeight: 600,
            outline: "none", marginBottom: 16, boxSizing: "border-box"
          }}
        />
        <textarea
          value={form.content}
          onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
          placeholder="Write freely here — this is your safe harbour. No judgment, just reflection..."
          style={{
            width: "100%", height: 320, padding: "14px 16px", borderRadius: 10,
            border: "1.5px solid rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.08)",
            color: "white", fontSize: 14, lineHeight: 1.8, resize: "vertical", outline: "none",
            boxSizing: "border-box", marginBottom: 20
          }}
        />
        <button onClick={save} style={{ ...btnPrimary, padding: "12px 28px", fontSize: 14, borderRadius: 10 }}>
          Save Entry 💾
        </button>
      </Glass>
    </div>
  );

  return (
    <div>
      <Glass style={{ padding: "24px 28px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ color: "white", margin: "0 0 4px", fontSize: 22, fontWeight: 700 }}>Safe Harbour Journal 📔</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: 14 }}>Your private space for thoughts and reflections</p>
        </div>
        <button onClick={openNew} style={{ ...btnPrimary, padding: "10px 20px", fontSize: 14, borderRadius: 10 }}>+ New Entry</button>
      </Glass>

      <Glass style={{ padding: "16px 20px", marginBottom: 20 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search entries..."
          style={{
            width: "100%", padding: "10px 14px", borderRadius: 8, border: "1.5px solid rgba(255,255,255,0.2)",
            background: "rgba(255,255,255,0.08)", color: "white", fontSize: 14, outline: "none", boxSizing: "border-box"
          }}
        />
      </Glass>

      {filtered.length === 0 ? (
        <Glass style={{ padding: "48px", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
          <p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>No entries yet. Start writing your first reflection.</p>
        </Glass>
      ) : (
        filtered.map(entry => (
          <Glass key={entry.id} style={{ padding: "24px 28px", marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ color: "white", margin: "0 0 8px", fontSize: 16, fontWeight: 600 }}>{entry.title}</h3>
                <p style={{ color: "rgba(255,255,255,0.65)", margin: "0 0 12px", fontSize: 13, lineHeight: 1.6 }}>{entry.content.slice(0, 160)}...</p>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>{entry.date}</span>
              </div>
              <div style={{ display: "flex", gap: 8, marginLeft: 16 }}>
                <button onClick={() => openEdit(entry)} style={{ ...btnOutline, padding: "6px 14px", fontSize: 12, borderRadius: 8 }}>Edit</button>
                <button onClick={() => del(entry.id)} style={{ ...btnDanger, padding: "6px 14px", fontSize: 12, borderRadius: 8 }}>Delete</button>
              </div>
            </div>
          </Glass>
        ))
      )}
    </div>
  );
}

// ── ANALYTICS ─────────────────────────────────────────────────────────────
function AnalyticsPage({ moodEntries, journalEntries }) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const moodData = moodEntries.slice(-6).map((e, i) => ({ day: days[i], mood: e.mood, stress: e.stress, sleep: e.sleep }));
  const avgMood = (moodEntries.reduce((s, e) => s + e.mood, 0) / moodEntries.length).toFixed(1);
  const avgStress = (moodEntries.reduce((s, e) => s + e.stress, 0) / moodEntries.length).toFixed(1);
  const avgSleep = (moodEntries.reduce((s, e) => s + e.sleep, 0) / moodEntries.length).toFixed(1);

  const insights = [
    avgStress <= 3 ? "✅ Your stress levels have decreased compared to last week — great progress!" : "⚠️ Stress has been elevated this week. Consider a grounding exercise.",
    avgMood >= 3.5 ? "😊 Your mood trend is positive — keep up what's working!" : "💙 Your mood has dipped recently. Remember, rough tides pass.",
    avgSleep >= 3.5 ? "🌙 You've been sleeping well — that's the foundation of wellness." : "😴 Sleep quality could use some attention. Try the Ocean Breathing exercise.",
  ];

  return (
    <div>
      <Glass style={{ padding: "24px 28px", marginBottom: 20 }}>
        <h2 style={{ color: "white", margin: "0 0 4px", fontSize: 22, fontWeight: 700 }}>Analytics 📊</h2>
        <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: 14 }}>Your wellness patterns at a glance</p>
      </Glass>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
        {[{ label: "Avg Mood", value: avgMood, emoji: "😊" }, { label: "Avg Stress", value: avgStress, emoji: "🌊" }, { label: "Avg Sleep", value: avgSleep, emoji: "🌙" }].map(s => (
          <Glass key={s.label} style={{ padding: "20px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 28 }}>{s.emoji}</div>
            <div style={{ color: "white", fontSize: 30, fontWeight: 700, margin: "8px 0 4px" }}>{s.value}</div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{s.label} / 5</div>
          </Glass>
        ))}
      </div>

      {/* Mood chart */}
      <Glass style={{ padding: "24px 28px", marginBottom: 20 }}>
        <h3 style={{ color: "white", margin: "0 0 20px", fontSize: 15, fontWeight: 600 }}>Weekly Mood Trend</h3>
        <MiniBarChart data={moodData} key1="mood" color="#4A90E2" label="Mood" />
      </Glass>

      <Glass style={{ padding: "24px 28px", marginBottom: 20 }}>
        <h3 style={{ color: "white", margin: "0 0 20px", fontSize: 15, fontWeight: 600 }}>Stress & Sleep Trends</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginBottom: 12 }}>STRESS (lower is better)</div>
            <MiniBarChart data={moodData} key1="stress" color="#E27A4A" label="Stress" />
          </div>
          <div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginBottom: 12 }}>SLEEP QUALITY</div>
            <MiniBarChart data={moodData} key1="sleep" color="#4AE2B8" label="Sleep" />
          </div>
        </div>
      </Glass>

      <Glass style={{ padding: "24px 28px" }}>
        <h3 style={{ color: "white", margin: "0 0 16px", fontSize: 15, fontWeight: 600 }}>💡 Insights</h3>
        {insights.map((ins, i) => (
          <div key={i} style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(255,255,255,0.08)", marginBottom: 10, color: "rgba(255,255,255,0.85)", fontSize: 13, lineHeight: 1.6 }}>
            {ins}
          </div>
        ))}
      </Glass>
    </div>
  );
}

function MiniBarChart({ data, key1, color }) {
  const max = 5;
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 100 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div style={{ width: "100%", height: Math.round((d[key1] / max) * 80), background: color, borderRadius: "4px 4px 0 0", opacity: 0.85, minHeight: 4 }} />
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>{d.day}</div>
        </div>
      ))}
    </div>
  );
}

// ── ANCHOR (Grounding Exercises) ───────────────────────────────────────────
function AnchorPage() {
  const [active, setActive] = useState(null);
  const exercises = [
    { id: "box", icon: "◻️", title: "Box Breathing", desc: "4-4-4-4 pattern to calm your nervous system", duration: "4 min", component: BoxBreathing },
    { id: "54321", icon: "🖐️", title: "5-4-3-2-1 Grounding", desc: "Use your senses to anchor to the present moment", duration: "5 min", component: Grounding54321 },
    { id: "ocean", icon: "🌊", title: "Ocean Breathing", desc: "Let your breath ride the waves of the ocean", duration: "3 min", component: OceanBreathing },
    { id: "body", icon: "🧘", title: "Body Scan", desc: "Gently bring awareness through your body", duration: "8 min", component: BodyScan },
    { id: "calm", icon: "🆘", title: "Emergency Calm Toolkit", desc: "Quick tools for moments of intense distress", duration: "2 min", component: EmergencyCalm },
  ];

  if (active) {
    const ex = exercises.find(e => e.id === active);
    const Comp = ex.component;
    return (
      <div>
        <Glass style={{ padding: "20px 28px", marginBottom: 20, display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => setActive(null)} style={{ ...btnOutline, padding: "8px 16px", fontSize: 13 }}>← Back</button>
          <h2 style={{ color: "white", margin: 0, fontSize: 20, fontWeight: 700 }}>{ex.icon} {ex.title}</h2>
        </Glass>
        <Glass style={{ padding: "32px" }}><Comp /></Glass>
      </div>
    );
  }

  return (
    <div>
      <Glass style={{ padding: "24px 28px", marginBottom: 20 }}>
        <h2 style={{ color: "white", margin: "0 0 4px", fontSize: 22, fontWeight: 700 }}>Anchor ⚓</h2>
        <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: 14 }}>Grounding exercises to bring you back to shore</p>
      </Glass>
      {exercises.map(ex => (
        <Glass key={ex.id} onClick={() => setActive(ex.id)} style={{ padding: "20px 24px", marginBottom: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 20, transition: "transform 0.15s" }}>
          <div style={{ fontSize: 36 }}>{ex.icon}</div>
          <div style={{ flex: 1 }}>
            <h3 style={{ color: "white", margin: "0 0 4px", fontSize: 15, fontWeight: 600 }}>{ex.title}</h3>
            <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: 13 }}>{ex.desc}</p>
          </div>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, whiteSpace: "nowrap" }}>{ex.duration} →</div>
        </Glass>
      ))}
    </div>
  );
}

function BoxBreathing() {
  const [phase, setPhase] = useState(0);
  const [count, setCount] = useState(4);
  const [running, setRunning] = useState(false);
  const phases = ["Inhale", "Hold", "Exhale", "Hold"];
  const colors = ["#4A90E2", "#7B68EE", "#4AE2B8", "#E2A44A"];
  useEffect(() => {
    if (!running) return;
    if (count > 0) {
      const t = setTimeout(() => setCount(c => c - 1), 1000);
      return () => clearTimeout(t);
    } else {
      setPhase(p => (p + 1) % 4);
      setCount(4);
    }
  }, [running, count]);
  const size = 140 - count * 8;
  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: 32, lineHeight: 1.7 }}>
        Breathe in a square pattern: 4 counts each for inhale, hold, exhale, hold. This activates your body's calm response.
      </p>
      <div style={{ position: "relative", width: 220, height: 220, margin: "0 auto 32px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{
          width: size, height: size, borderRadius: "50%",
          border: `3px solid ${colors[phase]}`,
          background: `${colors[phase]}22`,
          transition: "all 1s ease",
          display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column"
        }}>
          <div style={{ color: "white", fontSize: 28, fontWeight: 700 }}>{count}</div>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>{phases[phase]}</div>
        </div>
      </div>
      <button onClick={() => setRunning(r => !r)} style={{ ...btnPrimary, padding: "12px 32px", fontSize: 15, borderRadius: 50 }}>
        {running ? "⏸ Pause" : "▶ Start"}
      </button>
    </div>
  );
}

function OceanBreathing() {
  const [phase, setPhase] = useState("breathe-in");
  const [running, setRunning] = useState(false);
  const [count, setCount] = useState(5);
  const phases2 = { "breathe-in": { label: "Breathe in with the wave...", next: "breathe-out", dur: 5 }, "breathe-out": { label: "Breathe out as it recedes...", next: "breathe-in", dur: 5 } };
  useEffect(() => {
    if (!running) return;
    if (count > 0) { const t = setTimeout(() => setCount(c => c - 1), 1000); return () => clearTimeout(t); }
    else { const p = phases2[phase]; setPhase(p.next); setCount(p.dur); }
  }, [running, count, phase]);
  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: 32, lineHeight: 1.7 }}>
        Synchronize your breath with the rhythm of waves. Breathe in as the wave builds, breathe out as it recedes.
      </p>
      <div style={{ margin: "0 auto 32px", position: "relative", height: 80, overflow: "hidden", borderRadius: 12, background: "rgba(74,144,226,0.1)" }}>
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          height: phase === "breathe-in" ? "80%" : "20%",
          background: "rgba(74,144,226,0.4)",
          transition: "height 5s ease-in-out",
          borderRadius: "50% 50% 0 0 / 20px 20px 0 0"
        }} />
      </div>
      <div style={{ color: "white", fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{phases2[phase].label}</div>
      <div style={{ color: "#4A90E2", fontSize: 32, fontWeight: 700, marginBottom: 24 }}>{count}</div>
      <button onClick={() => setRunning(r => !r)} style={{ ...btnPrimary, padding: "12px 32px", fontSize: 15, borderRadius: 50 }}>
        {running ? "⏸ Pause" : "▶ Start"}
      </button>
    </div>
  );
}

function Grounding54321() {
  const [step, setStep] = useState(0);
  const steps = [
    { n: 5, sense: "SEE", q: "Name 5 things you can see right now", emoji: "👁️" },
    { n: 4, sense: "TOUCH", q: "Name 4 things you can physically feel", emoji: "✋" },
    { n: 3, sense: "HEAR", q: "Name 3 things you can hear right now", emoji: "👂" },
    { n: 2, sense: "SMELL", q: "Name 2 things you can smell", emoji: "👃" },
    { n: 1, sense: "TASTE", q: "Name 1 thing you can taste", emoji: "👅" },
  ];
  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: 32, lineHeight: 1.7 }}>Use your five senses to ground yourself in the present moment.</p>
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 32 }}>
        {steps.map((s, i) => (
          <div key={i} onClick={() => setStep(i)} style={{
            width: 40, height: 40, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            background: i === step ? "#4A90E2" : i < step ? "rgba(74,144,226,0.4)" : "rgba(255,255,255,0.1)",
            color: "white", fontWeight: 700, fontSize: 16, transition: "all 0.2s"
          }}>{s.n}</div>
        ))}
      </div>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{steps[step].emoji}</div>
      <div style={{ color: "#4A90E2", fontSize: 12, letterSpacing: 2, marginBottom: 12 }}>{steps[step].sense}</div>
      <p style={{ color: "white", fontSize: 18, fontWeight: 600, marginBottom: 32 }}>{steps[step].q}</p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        {step > 0 && <button onClick={() => setStep(s => s - 1)} style={{ ...btnOutline, padding: "10px 24px", fontSize: 14, borderRadius: 50 }}>← Previous</button>}
        {step < 4 ? <button onClick={() => setStep(s => s + 1)} style={{ ...btnPrimary, padding: "10px 24px", fontSize: 14, borderRadius: 50 }}>Next →</button>
          : <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, padding: "10px 0" }}>✅ Exercise complete — you're grounded.</div>}
      </div>
    </div>
  );
}

function BodyScan() {
  const parts = ["Crown of your head", "Forehead & temples", "Jaw & neck", "Shoulders", "Chest & heart", "Belly", "Hips & pelvis", "Legs", "Feet & toes"];
  const [current, setCurrent] = useState(0);
  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: 28, lineHeight: 1.7 }}>
        Move your awareness slowly through each body part. Notice sensations without judgment.
      </p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", marginBottom: 28 }}>
        {parts.map((p, i) => (
          <div key={i} onClick={() => setCurrent(i)} style={{
            padding: "6px 14px", borderRadius: 20, cursor: "pointer", fontSize: 12,
            background: i === current ? "#4A90E2" : i < current ? "rgba(74,144,226,0.3)" : "rgba(255,255,255,0.1)",
            color: "white", transition: "all 0.2s"
          }}>{p}</div>
        ))}
      </div>
      <div style={{ padding: "24px", background: "rgba(74,144,226,0.15)", borderRadius: 16, marginBottom: 28 }}>
        <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginBottom: 8 }}>FOCUS ON</div>
        <div style={{ color: "white", fontSize: 22, fontWeight: 600 }}>{parts[current]}</div>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, marginTop: 12, lineHeight: 1.7 }}>
          Breathe into this area. Notice any tension, warmth, or sensation. Simply observe without needing to change anything.
        </p>
      </div>
      {current < parts.length - 1
        ? <button onClick={() => setCurrent(c => c + 1)} style={{ ...btnPrimary, padding: "12px 28px", borderRadius: 50 }}>Next area →</button>
        : <div style={{ color: "rgba(255,255,255,0.7)" }}>✅ Body scan complete — well done.</div>}
    </div>
  );
}

function EmergencyCalm() {
  return (
    <div>
      <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: 24, lineHeight: 1.7, textAlign: "center" }}>
        When you need immediate relief — try one of these tools.
      </p>
      {[
        { icon: "❄️", title: "Cold Splash", desc: "Splash cold water on your face or hold your wrists under cold water for 30 seconds. This activates the dive reflex and slows your heart rate." },
        { icon: "✊", title: "Butterfly Hug", desc: "Cross your arms over your chest and alternately tap your shoulders. This bilateral stimulation helps process intense emotions." },
        { icon: "👁️", title: "Safe Place Visualization", desc: "Close your eyes. Picture a place where you feel completely safe and peaceful. Notice every detail — the sounds, smells, and sensations there." },
        { icon: "📞", title: "Reach Out", desc: "You don't have to face this alone. Text or call someone you trust. If in crisis, contact a helpline — speaking to another human helps." },
      ].map(t => (
        <div key={t.title} style={{ padding: "16px 20px", borderRadius: 12, background: "rgba(255,255,255,0.08)", marginBottom: 14 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <span style={{ fontSize: 24 }}>{t.icon}</span>
            <div>
              <div style={{ color: "white", fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{t.title}</div>
              <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, lineHeight: 1.6 }}>{t.desc}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── CHAT PAGE ──────────────────────────────────────────────────────────────
function ChatPage({ user, messages, setMessages }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = useCallback(async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: msg }]);
    setLoading(true);
    try {
      const history = [...messages, { role: "user", content: msg }];
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
       
          messages: history,
          user,
        })
      });
      const data = await res.json();
      const reply = data.reply;
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "I'm having trouble connecting right now. Please take a slow breath — I'll be back with you shortly. 🌊" }]);
    }
    setLoading(false);
  }, [input, loading, messages, setMessages, user]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 48px)" }}>
      <Glass style={{ padding: "20px 28px", marginBottom: 16, flexShrink: 0 }}>
        <h2 style={{ color: "white", margin: "0 0 4px", fontSize: 20, fontWeight: 700 }}>Chat with Rio 💬</h2>
        <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: 13 }}>A safe space for honest conversations</p>
      </Glass>

      {/* Messages */}
      <Glass style={{ flex: 1, overflowY: "auto", padding: "20px 24px", marginBottom: 16 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 16 }}>
            {m.role === "assistant" && (
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(74,144,226,0.5)", display: "flex", alignItems: "center", justifyContent: "center", marginRight: 10, flexShrink: 0, fontSize: 16 }}>🌊</div>
            )}
            <div style={{
              maxWidth: "75%", padding: "12px 16px", borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              background: m.role === "user" ? "rgba(74,144,226,0.5)" : "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.92)", fontSize: 14, lineHeight: 1.7
            }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(74,144,226,0.5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🌊</div>
            <div style={{ padding: "12px 16px", borderRadius: "18px 18px 18px 4px", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.15)" }}>
              <div style={{ display: "flex", gap: 4 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#4A90E2", animation: `pulse 1.2s ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </Glass>

      {/* Suggested prompts */}
      {messages.length <= 2 && (
        <Glass style={{ padding: "12px 16px", marginBottom: 12, flexShrink: 0 }}>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginBottom: 8 }}>SUGGESTED</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {SUGGESTED_PROMPTS.map(p => (
              <button key={p} onClick={() => send(p)} style={{
                padding: "6px 14px", borderRadius: 20, fontSize: 12, border: "1px solid rgba(255,255,255,0.25)",
                background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.8)", cursor: "pointer"
              }}>{p}</button>
            ))}
          </div>
        </Glass>
      )}

      {/* Input */}
      <Glass style={{ padding: "12px 16px", display: "flex", gap: 12, alignItems: "flex-end", flexShrink: 0 }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Share what's on your mind..."
          rows={1}
          style={{
            flex: 1, padding: "10px 14px", borderRadius: 12, border: "1.5px solid rgba(255,255,255,0.25)",
            background: "rgba(255,255,255,0.08)", color: "white", fontSize: 14, resize: "none",
            outline: "none", lineHeight: 1.5, maxHeight: 120
          }}
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || loading}
          style={{ ...btnPrimary, padding: "10px 18px", borderRadius: 12, fontSize: 16, flexShrink: 0, opacity: !input.trim() || loading ? 0.5 : 1 }}
        >
          →
        </button>
      </Glass>
    </div>
  );
}

// ── SETTINGS ───────────────────────────────────────────────────────────────
function SettingsPage({ user, darkMode, setDarkMode, onLogout }) {
  const [notifs, setNotifs] = useState(true);
  return (
    <div>
      <Glass style={{ padding: "24px 28px", marginBottom: 20 }}>
        <h2 style={{ color: "white", margin: "0 0 4px", fontSize: 22, fontWeight: 700 }}>Settings ⚙️</h2>
        <p style={{ color: "rgba(255,255,255,0.6)", margin: 0, fontSize: 14 }}>Customize your Rio experience</p>
      </Glass>

      <Glass style={{ padding: "24px 28px", marginBottom: 16 }}>
        <h3 style={{ color: "white", margin: "0 0 20px", fontSize: 15, fontWeight: 600 }}>Profile</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(74,144,226,0.5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: "white", fontWeight: 700 }}>
            {user?.nickname?.[0] || "U"}
          </div>
          <div>
            <div style={{ color: "white", fontWeight: 600, fontSize: 16 }}>{user?.name || "User"}</div>
            <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 13 }}>{user?.email || "user@example.com"}</div>
          </div>
        </div>
        {user?.challenges?.length > 0 && (
          <div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginBottom: 8 }}>FOCUS AREAS</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {user.challenges.map(c => (
                <span key={c} style={{ padding: "4px 12px", borderRadius: 20, background: "rgba(74,144,226,0.25)", border: "1px solid rgba(74,144,226,0.4)", color: "white", fontSize: 12 }}>{c}</span>
              ))}
            </div>
          </div>
        )}
      </Glass>

      {/* Notifications toggle */}
      <Glass style={{ padding: "20px 24px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: "white", fontSize: 14, fontWeight: 600, marginBottom: 2 }}>Daily Reminders</div>
          <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>Get a gentle nudge for your daily check-in</div>
        </div>
        <div onClick={() => setNotifs(v => !v)} style={{
          width: 44, height: 24, borderRadius: 12, cursor: "pointer", transition: "background 0.3s",
          background: notifs ? "#4A90E2" : "rgba(255,255,255,0.2)", position: "relative"
        }}>
          <div style={{ width: 18, height: 18, borderRadius: "50%", background: "white", position: "absolute", top: 3, left: notifs ? 23 : 3, transition: "left 0.3s" }} />
        </div>
      </Glass>

      {/* Dark Mode toggle — switches to full night ocean scene */}
      <Glass style={{ padding: "20px 24px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: "white", fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
            {darkMode ? "🌙 Night Mode" : "☀️ Day Mode"}
          </div>
          <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>
            {darkMode ? "Moon and stars — switch to daytime ocean" : "Switch to the midnight ocean scene"}
          </div>
        </div>
        <div onClick={() => setDarkMode(v => !v)} style={{
          width: 44, height: 24, borderRadius: 12, cursor: "pointer", transition: "background 0.3s",
          background: darkMode ? "#3a5fc8" : "rgba(255,255,255,0.2)", position: "relative"
        }}>
          <div style={{ width: 18, height: 18, borderRadius: "50%", background: "white", position: "absolute", top: 3, left: darkMode ? 23 : 3, transition: "left 0.3s" }} />
        </div>
      </Glass>

      <Glass style={{ padding: "16px 24px", marginBottom: 12 }}>
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 12 }}>EMERGENCY RESOURCES</div>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, lineHeight: 1.7, margin: 0 }}>
          If you're in crisis, please reach out: <strong style={{ color: "white" }}>iCall: 9152987821</strong> · <strong style={{ color: "white" }}>Vandrevala Foundation: 1860-2662-345</strong> (24/7)
        </p>
      </Glass>

      <div style={{ marginTop: 20, textAlign: "center" }}>
        <button onClick={onLogout} style={{ ...btnDanger, padding: "12px 28px", fontSize: 14, borderRadius: 50 }}>
          Sign Out
        </button>
      </div>
    </div>
  );
}

// ── Shared Styles ──────────────────────────────────────────────────────────
const btnPrimary = {
  background: "linear-gradient(135deg, #4A90E2, #0B3C6D)",
  color: "white", border: "none", borderRadius: 10, cursor: "pointer",
  fontWeight: 600, fontSize: 14, transition: "opacity 0.2s"
};
const btnOutline = {
  background: "rgba(255,255,255,0.1)", color: "white",
  border: "1.5px solid rgba(255,255,255,0.35)", borderRadius: 10, cursor: "pointer",
  fontWeight: 500, fontSize: 14, transition: "background 0.2s"
};
const btnDanger = {
  background: "rgba(220,53,69,0.25)", color: "#ff8fa3",
  border: "1.5px solid rgba(220,53,69,0.4)", borderRadius: 10, cursor: "pointer",
  fontWeight: 500, fontSize: 14
};
