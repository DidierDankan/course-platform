import Tag from "@components/ui/Tag";

const SkillTags = ({ skills = [] }) => {
  if (!skills?.length) {
    return <p className="panel-note">No skills added yet.</p>;
  }

  return (
    <ul className="tag-list">
      {skills.map((skill, index) => (
        <li key={`${skill}-${index}`}>
          <Tag>{skill}</Tag>
        </li>
      ))}
    </ul>
  );
};

export default SkillTags;
