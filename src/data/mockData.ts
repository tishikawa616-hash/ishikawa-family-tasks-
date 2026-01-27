import type { Board } from "@/types/board";

export const mockBoard: Board = {
  id: "board-1",
  title: "石川家タスクボード",
  columns: [
    {
      id: "col-todo",
      title: "予定",
      color: "#3b82f6",
      tasks: [
        {
          id: "task-1",
          title: "圃場の土壌pH測定",
          description: "西区画の土壌サンプルを採取してpHを測定する",
          priority: "high",
          dueDate: "2026-01-28",
          tags: ["圃場管理", "測定"],
        },
        {
          id: "task-2",
          title: "苗の発注確認",
          description: "春植え用の紅はるか苗を業者に確認",
          priority: "medium",
          tags: ["発注"],
        },
        {
          id: "task-3",
          title: "トラクター点検予約",
          priority: "low",
          tags: ["機械"],
        },
      ],
    },
    {
      id: "col-inprogress",
      title: "作業中",
      color: "#f59e0b",
      tasks: [
        {
          id: "task-4",
          title: "キュアリング温度管理",
          description: "貯蔵庫A: 32℃/90%湿度で4日目",
          priority: "high",
          dueDate: "2026-01-29",
          tags: ["貯蔵", "キュアリング"],
        },
      ],
    },
    {
      id: "col-review",
      title: "確認待ち",
      color: "#8b5cf6",
      tasks: [
        {
          id: "task-5",
          title: "出荷伝票の作成",
          description: "道の駅向け出荷分の伝票",
          priority: "medium",
          tags: ["出荷", "書類"],
        },
      ],
    },
    {
      id: "col-done",
      title: "完了",
      color: "#22c55e",
      tasks: [
        {
          id: "task-6",
          title: "週次売上レポート作成",
          priority: "low",
          tags: ["経理"],
        },
      ],
    },
  ],
};
