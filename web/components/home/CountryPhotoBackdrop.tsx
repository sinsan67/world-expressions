type Props = {
  photo?: string;
  fadeBottom?: boolean;
  children: React.ReactNode;
};

export default function CountryPhotoBackdrop({ photo, fadeBottom, children }: Props) {
  return (
    <div
      className={`country-photo${fadeBottom ? " fade-bottom" : ""}`}
      style={photo ? ({ "--photo": `url('${photo}')` } as React.CSSProperties) : undefined}
    >
      {children}
    </div>
  );
}
