import request from "supertest";
import initApp from "../server";
import { Express } from "express";
import mongoose from "mongoose";
import postsModel, { IPost } from "../models/posts_model";
import commentsModel, { IComment } from "../models/comments_model";
import usersModel, { IUser } from "../models/users_model";
import authMiddleware from "../middleware/auth/authMiddleware";

jest.mock("../middleware/auth/authMiddleware");

let app: Express;

let post: IPost;

let testUser: IUser = {
  username: "test",
  email: "test@test.com",
  password: "password",
};

beforeAll(async () => {
  app = await initApp();
  await postsModel.deleteMany();
  await commentsModel.deleteMany();
  await usersModel.deleteMany();
  testUser = await usersModel.create(testUser);
  (authMiddleware as jest.Mock).mockImplementation((req, res, next) => {
    req.params.userId = testUser._id?.toString();

    next();
  });
  post = await postsModel.create({
    title: "Test post",
    content: "Test post",
    userId: testUser._id!,
  });
});

beforeEach(async () => {
  await commentsModel.deleteMany();
});

afterAll(async () => {
  mongoose.connection.close();
});

describe("POST /comments", () => {
  it("should create new comment", async () => {
    const content = "This is my first comment!";
    const response = await request(app)
      .post(`/comments?post_id=${post._id}`)
      .send({
        content,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("_id");
    expect(response.body.content).toBe(content);
    expect(response.body.postID).toBe(post._id.toString());
  });

  it("should return 400 when content is missing", async () => {
    const response = await request(app)
      .post(`/comments?post_id=${post._id}`)
      .send({});

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("error");
  });

  it("should return 404 when post does not exist", async () => {
    const response = await request(app)
      .post(`/comments?post_id=673b7bd1df3f05e1bdcf5320`)
      .send({
        content: "This is my first comment!",
      });

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty("error");
  });

  it("should return 400 when post_id is missing", async () => {
    const response = await request(app).post(`/comments`).send({
      content: "This is my first comment!",
    });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("error");
  });

  it("should return 400 when post_id is invalid", async () => {
    const response = await request(app).post(`/comments?post_id=invalid`).send({
      content: "This is my first comment!",
    });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("error");
  });
});

let comments: Partial<IComment>[] = [
  { content: "First comment" },
  { content: "Second comment" },
];
describe("GET /comments", () => {
  describe("when there are no comments", () => {
    it("should return empty array", async () => {
      const response = await request(app).get(`/comments`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(0);
    });
  });

  describe("when there are comments", () => {
    beforeEach(async () => {
      comments = comments.map((comment: Partial<IComment>) => ({
        ...comment,
        postID: post._id,
        userId: testUser._id,
      }));
      comments.push({
        postID: new mongoose.Types.ObjectId("673b7bd1df3f05e1bdcf5321"),
        content: "Third comment",
        userId: testUser._id,
      });
      await commentsModel.create(comments);
    });

    it("should return all comments", async () => {
      const response = await request(app).get(`/comments`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(comments.length);
    });

    it("should return all comments by post id", async () => {
      const numberOfComments = comments.filter(
        (comment: Partial<IComment>) => comment.postID === post._id
      ).length;
      const response = await request(app).get(`/comments?post_id=${post._id}`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(numberOfComments);
    });

    it("should return empty array when post does not exist", async () => {
      const response = await request(app).get(
        `/comments?post_id=673b7bd1df3f05e1bdcf5320`
      );

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(0);
    });

    it("should return 400 when post_id is invalid", async () => {
      const response = await request(app).get(`/comments?post_id=invalid`);

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty("error");
    });
  });
});

describe("GET /comments/by_user?userId=", () => {
  describe("when there are no comments", () => {
    it("should return empty array", async () => {
      const response = await request(app).get(`/comments`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(0);
    });
  });

  describe("when there are comments", () => {
    beforeEach(async () => {
      comments = comments.map((comment: Partial<IComment>) => ({
        ...comment,
        postID: post._id,
        userId: testUser._id,
      }));
      comments.push({
        postID: new mongoose.Types.ObjectId("673b7bd1df3f05e1bdcf5321"),
        content: "Third comment",
        userId: testUser._id,
      });
      await commentsModel.create(comments);
    });

    it("should return all comments by user id", async () => {
      const response = await request(app).get(`/comments/by_user?userId=${testUser._id}`);

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveLength(comments.length);
    });

    it("should return 400 when user_id is invalid", async () => {
      const response = await request(app).get(`/comments/by_user?userId=invalid`);

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty("error");
    });
  });
});

describe("PUT /comments/:comment_id", () => {
  let savedComments: Partial<IComment>[];
  beforeEach(async () => {
    comments = comments.map((comment: Partial<IComment>) => ({
      ...comment,
      postID: post._id,
    }));
    savedComments = await commentsModel.create(comments);
  });

  it("should update comment by id", async () => {
    const newContent = "Updated comment";
    const response = await request(app)
      .put(`/comments/${savedComments[0]._id}`)
      .send({
        content: newContent,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.content).toBe(newContent);
  });

  it("should return 404 when comment does not exist", async () => {
    const response = await request(app)
      .put(`/comments/673b7bd1df3f05e1bdcf5320`)
      .send({
        content: "Updated comment",
        userId: testUser._id,
      });

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty("error");
  });

  it("should return 400 when content is missing", async () => {
    const response = await request(app)
      .put(`/comments/${savedComments[0]._id}`)
      .send({});

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("error");
  });

  describe("mongo failure", () => {
    it("should return 500 when there is a server error", async () => {
      jest.spyOn(commentsModel, "findByIdAndUpdate").mockImplementation(() => {
        throw new Error("Server error");
      });

      const response = await request(app)
        .put(`/comments/${savedComments[0]._id}`)
        .send({
          content: "Updated comment",
        });

      expect(response.statusCode).toBe(500);
      expect(response.body).toHaveProperty("error");
    });
  });
});

describe("DELETE /comments/:comment_id", () => {
  let savedComments: Partial<IComment>[];
  beforeEach(async () => {
    comments = comments.map((comment: Partial<IComment>) => ({
      ...comment,
      postID: post._id,
    }));
    savedComments = await commentsModel.create(comments);
  });

  it("should delete comment by id", async () => {
    const response = await request(app).delete(
      `/comments/${savedComments[0]._id}`
    );

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("_id");
  });

  it("should return 404 when comment does not exist", async () => {
    const response = await request(app).delete(
      `/comments/673b7bd1df3f05e1bdcf5320`
    );

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty("error");
  });

  describe("mongo failure", () => {
    it("should return 500 when there is a server error", async () => {
      jest
        .spyOn(commentsModel, "findByIdAndDelete")
        .mockRejectedValue(new Error("Server error"));

      const response = await request(app).delete(
        `/comments/${savedComments[0]._id}`
      );

      expect(response.statusCode).toBe(500);
      expect(response.body).toHaveProperty("error");
    });
  });
});
