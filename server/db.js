// server/db.js
const mongoose = require('mongoose');
const { Schema } = mongoose;
const {
  initialTeams,
  initialPlayers,
  initialUsers,
  initialTournaments
} = require('./initialData');

// --- SCHEMAS ---

const schemaOptions = {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
};

const UserSchema = new Schema({
  username: { type: String, required: true, unique: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'viewer'], default: 'viewer' }
}, schemaOptions);

const TeamSchema = new Schema({
  name: { type: String, required: true, unique: true },
  logo: { type: String, default: '♟' },
  owner: { type: String, default: 'Anonymous Owner' },
  budget: { type: Number, default: 1000 },
  points: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  draws: { type: Number, default: 0 },
  boardPoints: { type: Number, default: 0 }
}, schemaOptions);

const PlayerSchema = new Schema({
  name: { type: String, required: true },
  country: { type: String, default: 'USA' },
  teamId: { type: Schema.Types.ObjectId, ref: 'Team', default: null },
  elo: { type: Number, default: 1500 },
  mvps: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  draws: { type: Number, default: 0 },
  matchesPlayed: { type: Number, default: 0 },
  winPercent: { type: Number, default: 0 },
  auctionValue: { type: Number, default: 0 },
  status: { type: String, enum: ['SOLD', 'UNSOLD', 'BIDDING'], default: 'UNSOLD' },
  photo: { type: String }
}, schemaOptions);

const TournamentSchema = new Schema({
  name: { type: String, required: true },
  format: { type: String, required: true, enum: ['Round Robin', 'League Format', 'Swiss System', 'Knockout', 'Long Format', 'Team VS Team'] },
  startDate: { type: String },
  endDate: { type: String },
  teams: [{ type: Schema.Types.ObjectId, ref: 'Team' }],
  status: { type: String, enum: ['UPCOMING', 'ACTIVE', 'COMPLETED'], default: 'UPCOMING' },
  mvpPlayerId: { type: Schema.Types.ObjectId, ref: 'Player', default: null },
  goldPlayerId: { type: Schema.Types.ObjectId, ref: 'Player', default: null },
  silverPlayerId: { type: Schema.Types.ObjectId, ref: 'Player', default: null },
  bronzePlayerId: { type: Schema.Types.ObjectId, ref: 'Player', default: null }
}, schemaOptions);

const MatchSchema = new Schema({
  tournamentId: { type: Schema.Types.ObjectId, ref: 'Tournament', required: true },
  teamAId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
  teamBId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
  round: { type: Number, required: true },
  matchNumber: { type: Number, required: true },
  timeControl: { type: String, default: '10+6' },
  variant: { type: String, default: 'Standard' },
  matchLink: { type: String, default: '' },
  playerAId: { type: Schema.Types.ObjectId, ref: 'Player', default: null },
  playerBId: { type: Schema.Types.ObjectId, ref: 'Player', default: null },
  game1Result: { type: String, enum: ['playerA', 'playerB', 'draw', 'NP', null], default: null },
  game2Result: { type: String, enum: ['playerA', 'playerB', 'draw', 'NP', null], default: null },
  isCompleted: { type: Boolean, default: false },
  eloProcessed: { type: Boolean, default: false },
  date: { type: String },
  isCrazyGame: { type: Boolean, default: false },
  isGreatestGame: { type: Boolean, default: false }
}, schemaOptions);

const AuctionSchema = new Schema({
  playerId: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
  currentBid: { type: Number, default: 20 },
  currentBidderTeamId: { type: Schema.Types.ObjectId, ref: 'Team', default: null },
  status: { type: String, enum: ['IN_PROGRESS', 'COMPLETED', 'PAUSED'], default: 'IN_PROGRESS' },
  bidHistory: [{
    teamId: { type: Schema.Types.ObjectId, ref: 'Team' },
    teamName: String,
    amount: Number,
    timestamp: String
  }]
}, schemaOptions);

// --- MODELS ---
const User = mongoose.model('User', UserSchema);
const Team = mongoose.model('Team', TeamSchema);
const Player = mongoose.model('Player', PlayerSchema);
const Tournament = mongoose.model('Tournament', TournamentSchema);
const Match = mongoose.model('Match', MatchSchema);
const Auction = mongoose.model('Auction', AuctionSchema);

// --- SEED DATABASE ---
async function seedDB() {
  try {
    // 1. ALWAYS use path.join with __dirname for safe paths on Render Linux containers
    const dataPath = path.join(__dirname, 'db.json'); 
    
    if (!fs.existsSync(dataPath)) {
      console.log(`⚠️ Seeding aborted: db.json not found at ${dataPath}`);
      return;
    }

    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const data = JSON.parse(rawData);

    // 2. Clear out any empty structural collections to ensure a clean slate
    await Player.deleteMany({});
    
    // 3. Insert the dataset explicitly
    if (data.players && data.players.length > 0) {
      await Player.insertMany(data.players);
      console.log(`🚀 Success: Seeded ${data.players.length} players into Atlas!`);
    } else {
      console.log("⚠️ Seeding notice: 'players' array inside db.json is completely empty.");
    }
  } catch (error) {
    console.error("Failed to execute seedDB internal tracking:", error);
  }
}
// --- DATABASE CONNECTION CONTROL ---
/*async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/chess-freaks';
  console.log("Connecting to MongoDB at:", uri);
  await mongoose.connect(uri);
  console.log("MongoDB connection successful.");
  await seedDB();
}
// Inside server/db.js
async function connectDB() {
  // We change the port numbers to 443 to bypass local ISP blocks
  const uri = "mongodb://dhritimanmandalddm_db_user:chess_freaks@cluster0-shard-00-00.fmclf4a.mongodb.net:443,cluster0-shard-00-01.fmclf4a.mongodb.net:443,cluster0-shard-00-02.fmclf4a.mongodb.net:443/chess-freaks?ssl=true&replicaSet=atlas-9wz3m3-shard-0&authSource=admin&retryWrites=true&w=majority";

  console.log("Connecting to MongoDB via Port 443 standard URI...");
  
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000 
  });
  
  console.log("MongoDB connection successful.");
  await seedDB();
}*/
// --- DATABASE CONNECTION CONTROL ---
async function connectDB() {
  // Use the environment variable injected by Render, or a clean fallback string
  const uri = process.env.MONGODB_URI || "mongodb+srv://dhritimanmandalddm_db_user:chess_freaks@cluster0.fmclf4a.mongodb.net/chess-freaks?retryWrites=true&w=majority";

  console.log("Connecting to MongoDB Database...");
  
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000
  });
  
  console.log("MongoDB connection successful.");
  
  // --- FORCE SEEDING LOGIC ---
  console.log("CRITICAL: Running database seed function to populate collections...");
  try {
    await seedDB();
    console.log("Database seeding completed successfully!");
  } catch (seedError) {
    console.error("WARNING: Seeding function encountered an error:", seedError);
  }
}

// --- DB CLIENT WRAPPER INTERFACE (Asynchronous) ---
const dbClient = {
  connectDB,
  
  // Users
  users: {
    getAll: () => User.find({}),
    getByUsername: (username) => User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } }),
    getById: (id) => User.findById(id),
    create: async (userData) => {
      const user = new User(userData);
      await user.save();
      return user;
    }
  },

  // Teams
  teams: {
    getAll: () => Team.find({}),
    getById: (id) => Team.findById(id),
    create: async (teamData) => {
      const team = new Team(teamData);
      await team.save();
      return team;
    },
    update: async (id, updates) => {
      return Team.findByIdAndUpdate(id, updates, { new: true });
    },
    delete: async (id) => {
      await Team.findByIdAndDelete(id);
      // Remove team references from players & update status
      await Player.updateMany({ teamId: id }, { teamId: null, status: 'UNSOLD', auctionValue: 0 });
      return true;
    }
  },

  // Players
  players: {
    getAll: () => Player.find({}),
    getById: (id) => Player.findById(id),
    create: async (playerData) => {
      const p = new Player(playerData);
      await p.save();
      return p;
    },
    update: async (id, updates) => {
      // Calculate matches and win percentage automatically on updates
      if (updates.wins !== undefined || updates.losses !== undefined || updates.draws !== undefined) {
        const p = await Player.findById(id);
        if (p) {
          const w = updates.wins !== undefined ? Number(updates.wins) : (p.wins || 0);
          const l = updates.losses !== undefined ? Number(updates.losses) : (p.losses || 0);
          const d = updates.draws !== undefined ? Number(updates.draws) : (p.draws || 0);
          
          updates.matchesPlayed = w + l + d;
          updates.winPercent = updates.matchesPlayed > 0 ? Math.round((w / updates.matchesPlayed) * 100) : 0;
        }
      }
      return Player.findByIdAndUpdate(id, updates, { new: true });
    },
    delete: async (id) => {
      await Player.findByIdAndDelete(id);
      return true;
    }
  },

  // Tournaments
  tournaments: {
    getAll: () => Tournament.find({}),
    getById: (id) => Tournament.findById(id),
    create: async (tourData) => {
      const t = new Tournament(tourData);
      await t.save();
      return t;
    },
    update: async (id, updates) => {
      return Tournament.findByIdAndUpdate(id, updates, { new: true });
    },
    delete: async (id) => {
      await Tournament.findByIdAndDelete(id);
      // Cascade delete match fixtures under this tournament
      await Match.deleteMany({ tournamentId: id });
      return true;
    }
  },

  // Matches
  matches: {
    getAll: () => Match.find({}),
    getByTournament: (tourId) => Match.find({ tournamentId: tourId }),
    getById: (id) => Match.findById(id),
    create: async (matchData) => {
      const m = new Match(matchData);
      await m.save();
      return m;
    },
    createMany: async (matchList) => {
      const docs = matchList.map(m => ({
        matchNumber: m.matchNumber || 1,
        timeControl: m.timeControl || '10+6',
        variant: m.variant || 'Standard',
        matchLink: m.matchLink || '',
        playerAId: m.playerAId || null,
        playerBId: m.playerBId || null,
        game1Result: null,
        game2Result: null,
        isCompleted: false,
        eloProcessed: false,
        ...m
      }));
      return Match.insertMany(docs);
    },
    update: async (id, updates) => {
      return Match.findByIdAndUpdate(id, updates, { new: true });
    },
    delete: async (id) => {
      await Match.findByIdAndDelete(id);
      return true;
    },
    deleteByTournament: async (tourId) => {
      await Match.deleteMany({ tournamentId: tourId });
    }
  },

  // Auctions
  auctions: {
    getActive: () => Auction.findOne({ status: 'IN_PROGRESS' }),
    getAll: () => Auction.find({}),
    getById: (id) => Auction.findById(id),
    start: async (playerId) => {
      // Pause any active auction
      await Auction.updateMany({ status: 'IN_PROGRESS' }, { status: 'PAUSED' });
      
      const p = await Player.findById(playerId);
      if (!p) return null;

      p.status = 'BIDDING';
      await p.save();

      const auction = new Auction({
        playerId,
        currentBid: 20,
        currentBidderTeamId: null,
        status: "IN_PROGRESS",
        bidHistory: []
      });
      await auction.save();
      return auction;
    },
    placeBid: async (auctionId, teamId, amount) => {
      const auction = await Auction.findById(auctionId);
      if (!auction || auction.status !== 'IN_PROGRESS') return { error: "Auction is not active" };

      const team = await Team.findById(teamId);
      if (!team) return { error: "Team not found" };

      if (team.budget < amount) {
        return { error: "Team budget exceeded" };
      }

      if (amount <= auction.currentBid) {
        return { error: "Bid must exceed current bid of " + auction.currentBid };
      }

      auction.currentBid = amount;
      auction.currentBidderTeamId = teamId;
      
      auction.bidHistory.push({
        teamId,
        teamName: team.name,
        amount,
        timestamp: new Date().toLocaleTimeString()
      });
      
      await auction.save();
      return { success: true, auction };
    },
    complete: async (auctionId, unsold = false) => {
      const auction = await Auction.findById(auctionId);
      if (!auction) return null;

      auction.status = "COMPLETED";
      const player = await Player.findById(auction.playerId);

      if (unsold || !auction.currentBidderTeamId) {
        if (player) {
          player.status = 'UNSOLD';
          player.teamId = null;
          player.auctionValue = 0;
          await player.save();
        }
      } else {
        const team = await Team.findById(auction.currentBidderTeamId);
        if (team && player) {
          team.budget -= auction.currentBid;
          await team.save();
          
          player.status = 'SOLD';
          player.teamId = team.id;
          player.auctionValue = auction.currentBid;
          await player.save();
        }
      }

      await auction.save();
      return auction;
    }
  },

  // Reset database helper
  reset: async () => {
    const conn = mongoose.connection;
    await conn.dropDatabase();
    await seedDB();
    return true;
  }
};

module.exports = dbClient;
