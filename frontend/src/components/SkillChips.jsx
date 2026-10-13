export default function SkillChips({ heading, skills, cls, emptyMessage }) {
  return (
    <>
      <h2>
        {heading} <span className="count">({skills.length})</span>
      </h2>
      <div className="chips">
        {skills.length === 0 ? (
          <span className="chip none">{emptyMessage}</span>
        ) : (
          skills.map((name) => (
            <span key={name} className={'chip ' + cls}>{name}</span>
          ))
        )}
      </div>
    </>
  );
}
