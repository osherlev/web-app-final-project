import { HttpClientFactory } from "./httpClient";
import config from "../config.json";
import User from "../models/user";
import Comment from "../models/comment";
import { AxiosInstance } from "axios";

export class CommentsService {
  httpClient: AxiosInstance;

  constructor(user?: User, setUser?: (user: User | null) => void) {
    const httpClientFactory = new HttpClientFactory(user, setUser);
    this.httpClient = user
      ? httpClientFactory.authorizedHttpClient()
      : httpClientFactory.unauthorizedHttpClient();
  }

  getCommentsByPost(postId: string) {
    const controller = new AbortController();
    const request = this.httpClient.get<Comment[]>(
      `${config.backendURL}/comments?post_id=${postId}`,
      {
        signal: controller.signal,
      }
    );

    return { request, cancel: () => controller.abort() };
  }
  
  getComments() {
    const controller = new AbortController();
    const request = this.httpClient.get<Comment[]>(`${config.backendURL}/comments`, {
      signal: controller.signal,
    });

    return { request, cancel: () => controller.abort() };
  }

  getCommentsByUser(userId: string) {
    const controller = new AbortController();
    const request = this.httpClient.get<Comment[]>(
      `${config.backendURL}/comments/by_user?userId=${userId}`,
      {
        signal: controller.signal,
      }
    );

    return { request, cancel: () => controller.abort() };
  }

  saveNewComment(content: string, postId: string) {
    const controller = new AbortController();

    let request = this.httpClient.post<Comment>(
      `${config.backendURL}/comments?post_id=${postId}`,
      { content },
      {
        signal: controller.signal,
      }
    );

    return { request, cancel: () => controller.abort() };
  }

  deleteComment(commentId: string) {
    const controller = new AbortController();
    let request = this.httpClient.delete<Comment>(
      `${config.backendURL}/comments/${commentId}`,
      {
        signal: controller.signal,
      }
    );

    return { request, cancel: () => controller.abort() };
  }
}
