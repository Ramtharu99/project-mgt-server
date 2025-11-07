import express from "express";
import cors from "cors";
import "dotenv/config";
import { clerkMiddleware } from "@clerk/express";
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js";
import workspacesRouter from "./routes/worksSpace-routes.js";
import { protect } from "./middlewares/middleware.js";
import projectRouter from "./routes/project-route.js";
import taskRouter from "./routes/task-route.js";
import commentRouter from "./routes/comment-route.js";

const app = express();

app.use(express.json());
app.use(cors());
app.use(clerkMiddleware());

app.use("/api/inngest", serve({ client: inngest, functions }));
//routes
app.use("/api/workspaces", protect, workspacesRouter);
app.use("/api/projects", protect, projectRouter)
app.use("/api/tasks", protect, taskRouter)
app.use("/api/comments", protect, commentRouter)

app.get("/", (req, res) => {
  res.send("Server is running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
