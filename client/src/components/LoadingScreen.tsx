type LoadingScreenProps = {
  message: string;
};

export const LoadingScreen = ({ message }: LoadingScreenProps) => (
  <div className="loading-screen" role="status" aria-live="polite">
    <div className="loading-screen__panel">
      <p className="eyebrow">Health Partner</p>
      <h1>{message}</h1>
    </div>
  </div>
);
