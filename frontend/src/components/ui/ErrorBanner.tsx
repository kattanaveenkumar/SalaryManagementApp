interface Props {
  message: string;
}

export default function ErrorBanner({ message }: Props) {
  return (
    <div
      role="alert"
      className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
    >
      {message}
    </div>
  );
}
