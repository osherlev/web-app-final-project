import { useState } from "react";
import "./Comment.css";
import { Comment as CommentIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { Button, Typography } from "@mui/material";
import Comment from "../../models/comment";
import UserAvatar from "../UserAvatar/UserAvatar";
import AppTextField from "../TextField/TextField";
import { CommentsService } from "../../services/commentsService";
import { useUser } from "../../context/userContext.tsx";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);
import { formatDate } from "../../utils/formatDate.ts";

interface CommentProps {
  comment: Comment;
  refreshComments: () => void;
}

export const CommentComponent = ({ comment, refreshComments }: CommentProps) => {
  const { user, setUser } = useUser();

  const handleDeleteComment = (comment_id: string) => {
    const commentService = new CommentsService(user!, setUser);
    MySwal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        const { request } = commentService.deleteComment(comment_id);
        request
          .then(() => {
            refreshComments();
          })
          .catch((err) => {
            console.error(err);
          });
      }
    });
  };

  return (
    <div className="comment-container">
      <div className="comment-header">
        <UserAvatar user={comment.userId} className="user-avatar" />
        <div className="comment-details">
          <Typography
            variant="body2"
            sx={{ mb: 2 }}
            className="comment-username"
          >
            {comment.userId?.username}
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }} className="comment-time">
            {formatDate(comment?.date)}
          </Typography>
        </div>
      </div>
      <div className="comment-content">
        <Typography variant="body2" sx={{ mb: 2 }} className="comment-text">
          {comment.content}
        </Typography>
        {user?._id === comment.userId?._id && (
          <Button
            onClick={() => handleDeleteComment(comment._id)}
            variant="outlined"
            size="small"
            color="error"
            className="delete-comment-button"
            startIcon={<DeleteIcon />}
          >
            Delete Comment
          </Button>
        )}
      </div>
    </div>
  );
};

interface CommentSectionProps {
  comments: Comment[] | undefined;
  addComment: (content: string) => void;
  refreshComments: () => void;
}

const CommentSection = ({ comments, addComment, refreshComments }: CommentSectionProps) => {
  const [commentText, setCommentText] = useState("");
  const { user } = useUser();

  const handleAddComment = () => {
    if (commentText.trim()) {
      addComment(commentText);
      setCommentText("");
    }
  };

  return (
    <div className="comment-section">
      {user && (
      <div className="add-comment">
        <AppTextField
          multiline
          maxRows={5}
          label="Add a comment..."
          slotProps={{ inputLabel: { style: { color: "#fff" } } }}
          sx={{ "& fieldset": { borderColor: "#ccc" } }}
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
        />
        <Button
          onClick={handleAddComment}
          variant="contained"
          size="small"
          startIcon={<CommentIcon />}
          className="add-comment-button"
        >
          Add Comment
        </Button>
      </div>
      )}

      <div className="comments-list">
        {(comments?.length ?? 0) > 0 ? (
          comments?.map((comment: Comment) => (
            <CommentComponent key={comment._id} comment={comment} refreshComments={refreshComments} />
          ))
        ) : (
          <p>No comments yet</p>
        )}
      </div>
    </div>
  );
};

export default CommentSection;