import './GOBE.js'
const GOBE = (window as any).GOBE;

export const global: any = {
  client: null, // Client实例
  room: null, // Room实例
  group: null, // Group实例
  player: null, // Player实例
};

function init(reslove: () => void) {
  // 测试用
  GOBE.Logger.level = GOBE.LogLevel.INFO;
  const openId = location.hash.replace("#", "");
  if (!openId) return;

  // 实例化Client对象
  global.client = new GOBE.Client({
    appId: "245150415728004841", // 应用ID，具体获取可参见准备游戏信息
    openId, // 玩家ID，区别不同用户
    clientId: "1557244579667799872", // 客户端ID，具体获取可参见准备游戏信息
    clientSecret:
      "C017C61E129E83650D935387B6D1253107A36E197EAB668FCA7D89E5DF1D5B5A", // 客户端密钥，具体获取可参见准备游戏信息
    platform: { platform: GOBE.PlatformType.WEB }, // 平台类型（选填）
  });

  global.client.onInitResult((resultCode: number) => {
    // 初始化失败，重新初始化或联系华为技术支持
    if (resultCode !== 0) return;
    reslove(); // 初始化成功，做相关游戏逻辑处理
  });

  let playerId = "";
  // 调用Client.init方法进行初始化
  global.client
    .init()
    .then((client: any) => {
      // 已完成初始化请求，具体初始化结果通过onInitResult回调获取
      playerId = client.playerId;
      console.log(playerId);
      
    })
    .catch(() => {
      // 初始化请求失败，重新初始化或联系华为技术支持
    });

  return global
}

export async function initAcc() {
  // 1 初始化
  await new Promise<void>((res) => {
    // 注册Client.onInitResult监听回调
    init(res)
  });

  // 2 获取房间列表
  // 查询房间列表成功
  let rooms: any[];
  rooms = (await global.client.getAvailableRooms({ limit: 10 })).rooms;

  const props = {
    customPlayerStatus: 0,
    customPlayerProperties: "",
  };

  return {
    rooms,
    join: async (roomCode: string) => {
      const room = await global.client.joinRoom(roomCode, props);
      global.room = room;
      global.player = room.player; // 玩家自己
    },
    create: async () => {
      const room = await global.client.createRoom({ maxPlayers: 2 }, props);
      alert(room.roomCode);
      global.room = room;
      global.player = room.player; // 玩家自己
      global.room.onJoin((playerInfo: any) => {
        // 判断是否非房主玩家加入房间
        if (playerInfo.playerId !== global.room.ownerId) {
          global.room.startFrameSync();
          console.log("start frame!!!!!!!");
        }
      });
    },
  };
}

