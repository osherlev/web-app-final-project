import { useEffect, useState } from "react";
import { LoadingState } from "../services/loadingState";
import { AxiosResponse } from "axios";
import { useUser } from "../context/userContext";
import User from "../models/user";
import { CommentsService } from "../services/commentsService";
import Comment from "../models/comment";

const useComments = (selectedUser?: User) => {
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [commentsLoadingState, setCommentsLoadingState] = useState<LoadingState>(
    LoadingState.LOADING
  );
  const [error, setError] = useState<string | null>(null);
  const { user, setUser } = useUser();

  useEffect(() => {
    setCommentsLoadingState(LoadingState.LOADING);

    const commentsService = new CommentsService(user ?? undefined, setUser);
    const { request, cancel } = selectedUser
      ? commentsService.getCommentsByUser(selectedUser._id)
      : commentsService.getComments();

    request
      .then((response: AxiosResponse<Comment[]>) => {
        setComments(response.data);
        setCommentsLoadingState(LoadingState.LOADED);
      })
      .catch((err: any) => {
        setError(err.message);
        setCommentsLoadingState(LoadingState.ERROR);
      });

    return () => cancel();
  }, [selectedUser]);

  return {
    comments,
    setComments,
    commentsLoadingState,
    setCommentsLoadingState,
    error,
    setError,
  };
};

export default useComments;
