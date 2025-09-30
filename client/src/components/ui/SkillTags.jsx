// @components/profile/SkillsTags.jsx
import React from "react";
import Tag from "@components/ui/Tag";

const SkillTags = ({ skills = [] }) => {
  if (!skills?.length) {
    return <p className="text-gray-500 text-sm">No skills added yet.</p>;
  }

  return (
    <ul className="flex flex-wrap gap-[10px] list-none pl-[0px]">
      {skills.map((s, i) => (
        <li className="" key={`${s}-${i}`}>
          <Tag tone="blue">{s}</Tag>
        </li>
      ))}
    </ul>
  );
};

export default SkillTags;
