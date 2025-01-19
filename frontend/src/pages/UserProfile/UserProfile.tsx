import { useEffect, useState } from "react";
import PostsList from "../../components/PostsList/PostsList";
import "./UserProfile.css";
import { Box, Button, Tab, Tabs } from "@mui/material";
import UserAvatar from "../../components/UserAvatar/UserAvatar";
import usePosts from "../../hooks/usePosts";
import { useParams } from "react-router-dom";
import User from "../../models/user";
import { UsersService } from "../../services/usersService";
import { useUser } from "../../context/userContext";
import CommentsList from "../../components/CommentsList/CommentsList";
import useComments from "../../hooks/useComments";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      style={{ width: "100%" }}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const getUser = async (
  user: User | null,
  setUser: (user: User | null) => void,
  userId: string
) => {
  const usersService = user
    ? new UsersService(user, setUser)
    : new UsersService();
  const fetchedUser = await usersService.getUserById(userId!).request;

  return { selectedUser: fetchedUser.data };
};

const getSelectedUser = async (
  user: User | null,
  setUser: (user: User | null) => void,
  isUserLoaded: boolean,
  userId: string | undefined
) => {
  if (userId) {
    return await getUser(user, setUser, userId);
  }

  if (isUserLoaded && user) {
    return { selectedUser: user, isUserLoaded: true };
  } else {
    return { selectedUser: undefined, isUserLoaded: false };
  }
};

export default function UserProfile() {
  const [selectedTab, setSelectedTab] = useState(0);
  const { userId } = useParams();
  const { user, setUser, isUserLoaded } = useUser();
  const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined);

  const { posts, postsLoadingState } = usePosts(selectedUser);
  const { comments, commentsLoadingState } = useComments(selectedUser);

  useEffect(() => {
    getSelectedUser(user, setUser, isUserLoaded, userId).then(
      ({ selectedUser }) => {
        setSelectedUser(selectedUser);
      }
    );
  }, [user, isUserLoaded]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  return (
    <>
      <div className="userProfile">
        <div className="userProfileContainer">
          <div className="userDetailsContainer">
            <div className="userDetails">
              <div className="user">
                <UserAvatar className="userAvatar" user={selectedUser!} />
                <div className="userDetailsText">
                  <h1>@{selectedUser?.username}</h1>
                  <span>
                    {selectedUser?.posts
                      ? `${selectedUser?.posts?.length} questions`
                      : ""}
                  </span>
                </div>
              </div>

              {userId ? (
                <div></div>
              ) : (
                <Button
                  variant="contained"
                  color="secondary"
                  style={{ width: "100%", maxWidth: "480px" }}
                >
                  Edit Profile
                </Button>
              )}
            </div>
          </div>

          <Box
            sx={{
              p: 0,
              borderBottom: 1,
              borderColor: "divider",
              width: "100%",
            }}
          >
            <Tabs value={selectedTab} onChange={handleTabChange}>
              <Tab label="Questions" />
              <Tab label="Answers" />
            </Tabs>
          </Box>
          <CustomTabPanel value={selectedTab} index={0}>
            <PostsList
              maxPostsPerPage={5}
              posts={posts ?? []}
              loadingState={postsLoadingState}
            />
          </CustomTabPanel>
          <CustomTabPanel value={selectedTab} index={1}>
            <CommentsList
                maxCommentsPerPage={5}
                comments={comments ?? []}
                loadingState={commentsLoadingState}
              />
          </CustomTabPanel>
        </div>
      </div>
    </>
  );
}
