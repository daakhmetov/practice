import Machine from '../models/Machine.js';

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const getMachines = async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};

    if (status && ['Online', 'Offline', 'Error'].includes(status)) {
      filter.status = status;
    }

    if (search?.trim()) {
      const safeSearch = escapeRegex(search.trim());
      filter.$or = [
        { machineId: { $regex: safeSearch, $options: 'i' } },
        { address: { $regex: safeSearch, $options: 'i' } }
      ];
    }

    const machines = await Machine.find(filter).sort({ machineId: 1 });
    res.json(machines);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load machines', error: error.message });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const [stats] = await Machine.aggregate([
      {
        $group: {
          _id: null,
          totalMachines: { $sum: 1 },
          onlineMachines: {
            $sum: { $cond: [{ $eq: ['$status', 'Online'] }, 1, 0] }
          },
          errorMachines: {
            $sum: { $cond: [{ $eq: ['$status', 'Error'] }, 1, 0] }
          },
          totalRevenue: { $sum: '$revenue' }
        }
      },
      {
        $project: {
          _id: 0,
          totalMachines: 1,
          onlineMachines: 1,
          errorMachines: 1,
          totalRevenue: 1
        }
      }
    ]);

    res.json(stats ?? {
      totalMachines: 0,
      onlineMachines: 0,
      errorMachines: 0,
      totalRevenue: 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load dashboard stats', error: error.message });
  }
};

export const restockMachine = async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id);

    if (!machine) {
      return res.status(404).json({ message: 'Machine not found' });
    }

    machine.drinksCount = machine.maxCapacity;

    if (machine.status === 'Error') {
      machine.status = 'Online';
    }

    await machine.save();
    res.json(machine);
  } catch (error) {
    res.status(500).json({ message: 'Failed to restock machine', error: error.message });
  }
};

export const collectCash = async (req, res) => {
  try {
    const machine = await Machine.findByIdAndUpdate(
      req.params.id,
      { revenue: 0 },
      { new: true, runValidators: true }
    );

    if (!machine) {
      return res.status(404).json({ message: 'Machine not found' });
    }

    res.json(machine);
  } catch (error) {
    res.status(500).json({ message: 'Failed to collect cash', error: error.message });
  }
};

export const seedMachines = async (req, res) => {
  try {
    const machines = [
      {
        machineId: 'VBOX-001',
        address: 'Алматы, Адрес 1',
        status: 'Online',
        drinksCount: 95,
        maxCapacity: 100,
        revenue: 32000
      },
      {
        machineId: 'VBOX-002',
        address: 'Алматы, Адрес 2',
        status: 'Online',
        drinksCount: 15,
        maxCapacity: 100,
        revenue: 45000
      },
      {
        machineId: 'VBOX-003',
        address: 'Астана, Адрес 3',
        status: 'Error',
        drinksCount: 0,
        maxCapacity: 100,
        revenue: 12000
      },
      {
        machineId: 'VBOX-004',
        address: 'Шымкент, Адрес 4',
        status: 'Offline',
        drinksCount: 40,
        maxCapacity: 100,
        revenue: 0
      }
    ];

    await Machine.deleteMany({});
    const createdMachines = await Machine.insertMany(machines);

    res.json({
      message: 'Seed completed successfully',
      count: createdMachines.length,
      machines: createdMachines
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to seed machines', error: error.message });
  }
};
