// STUB — flesh out per remotion/README.md. Renders a vertical captioned Short.
// Props mirror the ShortScript shape from @studio/core.
import { AbsoluteFill, Img, Audio, Sequence, useVideoConfig } from "remotion";

type Props = {
  images: string[];       // file:// or https image urls (Gemini-generated, original)
  audioSrc: string;       // narration wav/mp3
  captions: string[];     // onScreenText beats
  hook: string;
};

export const ShortVideo: React.FC<Props> = ({ images, audioSrc, captions, hook }) => {
  const { durationInFrames, fps } = useVideoConfig();
  const per = Math.floor(durationInFrames / Math.max(1, images.length));
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {images.map((src, i) => (
        <Sequence key={i} from={i * per} durationInFrames={per}>
          <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <AbsoluteFill style={{ alignItems: "center", justifyContent: i === 0 ? "flex-start" : "flex-end", padding: 80 }}>
            <span style={{ fontFamily: "monospace", fontSize: 56, color: "#fff", background: "rgba(0,0,0,.5)", padding: "12px 20px", borderRadius: 12, textAlign: "center" }}>
              {i === 0 ? hook : captions[i] ?? ""}
            </span>
          </AbsoluteFill>
        </Sequence>
      ))}
      <Audio src={audioSrc} />
    </AbsoluteFill>
  );
};
