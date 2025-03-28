import Avatar from "@mui/material/Avatar";
import User from "../../models/user";

function stringToColor(string: string) {
  let hash = 0;
  let i;

  for (i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = "#";

  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }

  return color;
}

function stringAvatar(name?: string) {
  if (!name) return null;
  return {
    sx: {
      bgcolor: stringToColor(name),
    },
    children: name
      .split(" ")
      .reduce((finalValue, currentWord) => (finalValue += currentWord[0]), ""),
  };
}

export default function UserAvatar({
  user,
  className,
}: {
  user?: User;
  className?: string;
}) {
  return (
    <Avatar
      className={className}
      src={user?.avatarUrl}
      {...stringAvatar(user?.username)}
    ></Avatar>
  );
}
