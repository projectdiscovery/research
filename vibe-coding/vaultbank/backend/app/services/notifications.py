import json
from typing import Dict, Set
from fastapi import WebSocket
from sqlalchemy.orm import Session
from ..models.notification import Notification, NotificationType


class NotificationManager:
    def __init__(self):
        self.connections: Dict[int, Set[WebSocket]] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.connections:
            self.connections[user_id] = set()
        self.connections[user_id].add(websocket)

    def disconnect(self, user_id: int, websocket: WebSocket):
        if user_id in self.connections:
            self.connections[user_id].discard(websocket)
            if not self.connections[user_id]:
                del self.connections[user_id]

    async def send_to_user(self, user_id: int, data: dict):
        if user_id in self.connections:
            dead = set()
            for ws in self.connections[user_id]:
                try:
                    await ws.send_json(data)
                except Exception:
                    dead.add(ws)
            for ws in dead:
                self.connections[user_id].discard(ws)

    async def create_and_push(
        self,
        db: Session,
        user_id: int,
        title: str,
        message: str,
        notification_type: NotificationType,
        data: dict = None,
    ) -> Notification:
        n = Notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type=notification_type,
            data=json.dumps(data) if data else None,
        )
        db.add(n)
        db.commit()
        db.refresh(n)

        await self.send_to_user(
            user_id,
            {
                "id": n.id,
                "title": title,
                "message": message,
                "type": notification_type.value,
                "data": data,
                "is_read": False,
                "created_at": n.created_at.isoformat(),
            },
        )
        return n


notification_manager = NotificationManager()
