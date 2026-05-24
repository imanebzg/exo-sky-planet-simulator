import './LoadingNebula.css';

export default function LoadingNebula({ message = 'Scanning the cosmos...' }) {
  return (
    <div className="loading-nebula">
      <div className="nebula-rings">
        <div className="ring ring-1" />
        <div className="ring ring-2" />
        <div className="ring ring-3" />
        <div className="planet-core" />
      </div>
      <p className="loading-message">{message}</p>
      <p className="loading-sub">Please hold on, we're traveling light-years ✨</p>
    </div>
  );
}
