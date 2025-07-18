import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AvatarCircles } from "@/components/magicui/avatar-circles";
import { InteractiveHoverButton } from "@/components/magicui/interactive-hover-button";
import { RainbowButton } from "@/components/magicui/rainbow-button";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
type GithubRepo = {
  id: number;
  name: string;
  description: string;
  language: string;
  html_url: string;
  license?: { key: string };
  owner: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
  topics: string[];
};

type ToolCardProps = {
  github: GithubRepo;
  npm?: boolean;
};

const ToolCard = ({ github, npm }: ToolCardProps) => {
  return (
    <Card className="w-[30rem] min-h-150 mx-h-180 flex items-center justify-around flex-col m-2">
      <CardHeader className="w-full border-b">
        <CardTitle>{github.name}</CardTitle>
        <CardDescription>{github.description}</CardDescription>
      </CardHeader>
      <CardContent className="w-full h-80 flex justify-around flex-col gap-4">
        <span
          className={`${github.language.toLowerCase() === "javascript" ? "bg-amber-300" : "bg-blue-600"} py-2 px-4 rounded-md w-fit`}
        >
          {github.language}
        </span>
        <a
          href={`${github.html_url}`}
          target="_blank"
          rel="noreferrer"
          className="rounded-md"
        >
          <img
            src={`https://opengraph.githubassets.com/1/${github.owner.login}/${github.name}`}
            alt="github image"
            className="w-full h-full rounded-xl shadow-neutral-500 object-fill hover:scale-105 cursor-pointer"
          />
        </a>
        <span
          className={`${github.license?.key ? "bg-green-700" : "bg-red-400"} py-2 px-4 rounded-md w-fit self-end`}
        >
          {github.license?.key.toUpperCase() || "unknown"}
        </span>
      </CardContent>
      <CardFooter className="w-full flex items-center justify-around border-t-1 py-2">
        <a
          href={`${github.owner.html_url}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 "
        >
          <AvatarCircles
            avatarUrls={[
              {
                imageUrl: github?.owner?.avatar_url,
              },
            ]}
            numPeople={0}
          />
          <span className="text-">{github?.owner?.login}</span>
        </a>
        <a
          href={`${github.html_url}`}
          target="_blank"
          rel="noreferrer"
          className="rounded-md"
        >
          <InteractiveHoverButton className="rounded-md">
            Github
          </InteractiveHoverButton>
        </a>
        {npm && (
          <a
            href={`https://www.npmjs.com/package/${github.name}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-md"
          >
            <RainbowButton>Npm Registry</RainbowButton>
          </a>
        )}
      </CardFooter>
    </Card>
  );
};
function Tools() {
  const [githubData, setgithubData] = useState<GithubRepo[] | null>(null);
  const searchTopics = ["tools"];
  const github = useQuery({
    queryKey: ["getGithub"],
    queryFn: async () => {
      const response = await axios.get(
        "https://api.github.com/users/kishan-agarwal-28/repos"
      );
      return response.data;
    },
    staleTime: 1000 * 60 * 60 * 24,
    enabled: false,
  });
  useEffect(() => {
    github.refetch();

    return () => {};
  }, []);
  useEffect(() => {
    (async () => {
      if (github.isSuccess) {
        setgithubData(github?.data);
      }
    })();

    return () => {};
  }, [github.isSuccess]);
  if (!githubData) {
    return <div className="w-dvh h-dvh"></div>;
  }
  return (
    <div className="flex flex-wrap justify-around gap-4 w-full">
      {githubData.map(
        (data) =>
          searchTopics.some((topic) => data.topics.includes(topic)) && (
            <ToolCard
              key={data.id}
              github={data}
              npm={searchTopics.some((topic) => data.topics.includes(topic))}
            />
          )
      )}
    </div>
  );
}

export default Tools;
