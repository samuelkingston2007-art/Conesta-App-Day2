import fs from "fs";
import path from "path";

const DB_FILE = path.join(process.cwd(), "mock_db.json");

interface MockUser {
  _id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

interface MockGift {
  _id: string;
  userId: string;
  name: string;
  occasion: string;
  budget: number;
  notes?: string;
  isPurchased: boolean;
  createdAt: string;
}

interface MockData {
  users: MockUser[];
  gifts: MockGift[];
}

function readData(): MockData {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial: MockData = { users: [], gifts: [] };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf8");
      return initial;
    }
    const content = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(content);
  } catch (error) {
    console.error("Error reading mock database file:", error);
    return { users: [], gifts: [] };
  }
}

function writeData(data: MockData) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    console.error("Error writing mock database file:", error);
  }
}

export const MockDb = {
  getUsers: async () => {
    return readData().users;
  },
  
  findUserByEmail: async (email: string) => {
    const data = readData();
    return data.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  findUserById: async (id: string) => {
    const data = readData();
    return data.users.find(u => u._id === id) || null;
  },

  createUser: async (email: string, passwordHash: string) => {
    const data = readData();
    const newUser: MockUser = {
      _id: Math.random().toString(36).substring(2, 11),
      email: email.toLowerCase(),
      passwordHash,
      createdAt: new Date().toISOString()
    };
    data.users.push(newUser);
    writeData(data);
    return newUser;
  },

  getGifts: async (userId: string) => {
    const data = readData();
    return data.gifts
      .filter(g => g.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  addGift: async (userId: string, giftData: { name: string; occasion: string; budget?: number; notes?: string }) => {
    const data = readData();
    const newGift: MockGift = {
      _id: Math.random().toString(36).substring(2, 11),
      userId,
      name: giftData.name,
      occasion: giftData.occasion,
      budget: giftData.budget || 0,
      notes: giftData.notes || "",
      isPurchased: false,
      createdAt: new Date().toISOString()
    };
    data.gifts.push(newGift);
    writeData(data);
    return newGift;
  },

  updateGift: async (giftId: string, userId: string, update: Partial<Omit<MockGift, "_id" | "userId" | "createdAt">>) => {
    const data = readData();
    const index = data.gifts.findIndex(g => g._id === giftId && g.userId === userId);
    if (index === -1) return null;

    data.gifts[index] = {
      ...data.gifts[index],
      ...update
    };
    writeData(data);
    return data.gifts[index];
  },

  deleteGift: async (giftId: string, userId: string) => {
    const data = readData();
    const originalLength = data.gifts.length;
    data.gifts = data.gifts.filter(g => !(g._id === giftId && g.userId === userId));
    writeData(data);
    return data.gifts.length < originalLength;
  }
};
