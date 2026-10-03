export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-line px-5 py-7 text-sm text-mute sm:px-8">
      <p className="m-0">
        &copy; <time dateTime={String(year)}>{year}</time> Astrape
      </p>
    </footer>
  );
}
