<template>
    <div class="maintenance-management">
      <el-card>
        <template #header>
          <h1>维保单统计</h1>
        </template>
        
        <el-row>
          <el-col :span="24" class="btn-container">
            <!-- 搜索和筛选功能 -->
            <el-input
              v-model="searchQuery"
              placeholder="输入出厂编号、使用单位、维保员组员搜索"
              style="width: 300px; margin-right: 10px;"
              clearable
            />
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-col>
        </el-row>
        
        <el-row>
          <el-table
            :data="tableData"
            style="width: 100%"
          >
            <el-table-column prop="出厂编号" label="出厂编号" width="200" />
            <el-table-column prop="使用单位" label="使用单位" width="200" />
            <el-table-column prop="维保月份" label="维保月份" width="150" />
            <el-table-column prop="维保员组员" label="维保员组员" width="150" />
            <el-table-column prop="维保次数" label="维保次数" width="150" />
          </el-table>
        </el-row>
        
        <el-row>
          <el-pagination
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            :current-page="currentPage"
            :page-sizes="[10, 20, 30]"
            :page-size="pageSize"
            layout="total, sizes, prev, pager, next, jumper"
            :total="totalCount"
          />
        </el-row>
      </el-card>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import axios from 'axios';
  import { ElMessage } from 'element-plus';
  
  const apiBaseUrl = 'http://localhost:3000';
  
  interface MaintenanceRecord {
    出厂编号: string;
    使用单位: string;
    维保月份: string;
    维保员组员: string;
    维保次数: number;
  }
  
  // 表格相关数据
  const tableData = ref<MaintenanceRecord[]>([]);
  const currentPage = ref(1);
  const pageSize = ref(10);
  const totalCount = ref(0);
  
  // 搜索结果相关
  const searchQuery = ref('');
  
  // 初始化获取数据
// 初始化获取数据
const fetchData = async (query = '') => {
  try {
    const queryParams = {
      page: currentPage.value,
      limit: pageSize.value,
      q: query
    };

    const response = await axios.get(
      `${apiBaseUrl}/api/EquipmentMaintenanceOrderView`,
      { params: queryParams }
    );
    tableData.value = response.data.data;
    totalCount.value = response.data.totalCount;
  } catch (error) {
    console.error('获取数据失败', error);
    ElMessage.error('获取数据失败');
  }
};

// const fetchData = async (query?: string) => {
//     try {
//         const queryParams = {
//             page: currentPage.value,
//             limit: pageSize.value,
//             ...(query ? { q: query } : {})
//         };

//         const response = await axios.get(
//             `${apiBaseUrl}/api/EquipmentMaintenanceOrderView`,
//             { params: queryParams }
//         );
//         tableData.value = response.data.data;
//         totalCount.value = response.data.totalCount;
//     } catch (error) {
//         console.error('获取数据失败', error);
//         ElMessage.error('获取数据失败');
//     }
// };
// const fetchData = async (query?: string) => {
//   try {
//     const queryParams = {
//       page: currentPage.value,
//       limit: pageSize.value,
//       ...(query ? { q: query } : {})
//     };

//     const response = await axios.get(
//       `${apiBaseUrl}/api/EquipmentMaintenanceOrderView`, // 确保请求路径与后端路由匹配
//       { params: queryParams }
//     );
//     tableData.value = response.data.data;
//     totalCount.value = response.data.totalCount;
//   } catch (error) {
//     console.error('获取数据失败', error);
//     ElMessage.error('获取数据失败');
//   }
// };

  // const fetchData = async (query?: string) => {
  //   try {
  //     const queryParams = {
  //       page: currentPage.value,
  //       limit: pageSize.value,
  //       ...(query ? { q: query } : {})
  //     };
  
  //     const response = await axios.get(`${apiBaseUrl}/api/EquipmentMaintenanceOrderView`, {
  //       params: queryParams
  //     });
  //     tableData.value = response.data.data;
  //     totalCount.value = response.data.totalCount;
  //   } catch (error) {
  //     console.error('获取数据失败', error);
  //     ElMessage.error('获取数据失败');
  //   }
  // };
  
  // 切换页面时获取数据
  const handleCurrentChange = (val: number) => {
    currentPage.value = val;
    fetchData(searchQuery.value);
  };
  
  // 切换每页显示条数时获取数据
  const handleSizeChange = (val: number) => {
    pageSize.value = val;
    fetchData(searchQuery.value);
  };
  
  // 筛选按钮点击事件
  const handleSearch = () => {
    currentPage.value = 1; // 重置到第一页
    fetchData(searchQuery.value);
  };
  
  // 重置搜索按钮点击事件
  const resetSearch = () => {
    searchQuery.value = '';
    fetchData();
  };
  
  onMounted(() => {
    fetchData();
  });
  </script>
  
  <style scoped>
  .btn-container {
    margin-bottom: 20px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
  }
  </style>