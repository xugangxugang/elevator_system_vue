<template>
  <div>
    <el-card>
      <template #header>
        <h1>{{ resourceName }} 管理</h1>
      </template>
      <el-row>
        <el-col :span="12">
          <el-input v-model="searchQuery" placeholder="搜索档案盒编号" @input="search" clearable />
        </el-col>
        <el-col :span="6">
          <el-button @click="exportData">导出数据</el-button>
        </el-col>
        <el-col :span="6">
          <el-button type="primary" @click="addItem">新增档案盒</el-button>
        </el-col>
      </el-row>
      <el-table :data="data" stripe>
        <el-table-column v-for="(column, index) in columns" :key="index" :prop="column" :label="column" />
        <el-table-column label="操作">
          <template #default="scope">
            <el-button size="small" @click="editItem(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteItem(scope.row.ID)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="currentPage"
        :page-sizes="[10, 20, 30]"
        :page-size="pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="totalCount"
      />
    </el-card>
    <el-dialog v-model="dialogVisible" :title="dialogTitle">
      <el-form 
        :model="formData" 
        label-width="120px"
        ref="formRef"
        :rules="rules"
      >
        <el-form-item label="档案盒编号" prop="档案盒编号">
          <el-input v-model="formData.档案盒编号" placeholder="请输入档案盒编号" />
        </el-form-item>
        <el-form-item label="电梯出厂配置表ID" prop="电梯出厂配置表ID">
          <el-select 
            v-model="formData.电梯出厂配置表ID" 
            placeholder="请选择电梯出厂配置" 
            filterable
            remote
            :remote-method="searchElevators"
            loading-text="加载中..."
          >
            <el-option 
              v-for="elevator in elevators" 
              :key="elevator.ID" 
              :label="`${elevator.使用单位} - ${elevator.产品编号} - ${elevator.设备代码}`" 
              :value="elevator.ID" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="停保时间" prop="停保时间">
          <el-input v-model="formData.停保时间" placeholder="请输入停保时间" />
        </el-form-item>
        <el-form-item label="作废时间" prop="作废时间">
          <el-input v-model="formData.作废时间" placeholder="请输入作废时间" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveForm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { ElForm } from 'element-plus';

// 定义接口
interface Resource {
  ID: string;
  档案盒编号: string;
  电梯出厂配置表ID: string | null;
  停保时间: string;
  作废时间: string;
 
  档案盒创建时间: string;
}

interface Elevator {
  ID: string;
  使用单位: string;
  产品编号: string;
  设备代码: string;
}

const apiBaseUrl = 'http://localhost:3000';

const resource = ref('archiveBoxes');
const resourceName = ref('档案盒表');
const columns = ref([
  'ID',
  '档案盒编号',
  '使用单位',
  '产品编号',
  '设备代码',
  '档案盒创建时间',
  '停保时间',
  '作废时间'
]);
const data = ref<Resource[]>([]);
const searchQuery = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const totalCount = ref(0);
const dialogVisible = ref(false);
const formData = ref<Resource>({
  ID: '',
  档案盒编号: '',
  电梯出厂配置表ID: null,
  停保时间: '',
  作废时间: '',
  
  档案盒创建时间: ''
});
const dialogTitle = ref('');
const formRef = ref<InstanceType<typeof ElForm>>();
const elevators = ref<Elevator[]>([]);

const rules = {
  '档案盒编号': [{ required: true, message: '档案盒编号不能为空', trigger: 'blur' }],
  '电梯出厂配置表ID': [{ required: true, message: '电梯出厂配置表ID不能为空', trigger: 'blur' }]
};

const fetchData = async () => {
  try {
    const response = await axios.get(`${apiBaseUrl}/api/${resource.value}`, {
      params: {
        page: currentPage.value,
        limit: pageSize.value,
        q: searchQuery.value
      }
    });

    data.value = response.data.data;
    totalCount.value = response.data.totalCount; 
  } catch (error) {
    console.error('获取数据时出错:', error);
  }
};

const fetchElevators = async (params?: any) => {
  try {
    const response = await axios.get(`${apiBaseUrl}/api/elevatorBasicInfos`, { params });
    elevators.value = response.data.data;
  } catch (error) {
    console.error('获取电梯出厂配置数据时出错:', error);
  }
};

const searchElevators = async (query: string) => {
  if (query) {
    fetchElevators({
      q: query,
      page: 1,
      limit: 10
    });
  } else {
    fetchElevators();
  }
};

const search = () => {
  currentPage.value = 1;
  fetchData();
};

const exportData = async () => {
  try {
    const response = await axios.get(`${apiBaseUrl}/api/${resource.value}/export`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${resourceName.value}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('导出数据时出错:', error);
  }
};

const editItem = async (item: Resource) => {
  formData.value = {
    ID: item.ID,
    档案盒编号: item.档案盒编号,
    电梯出厂配置表ID: item.电梯出厂配置表ID,
    停保时间: item.停保时间,
    作废时间: item.作废时间,
    
    档案盒创建时间: item.档案盒创建时间
  };
  dialogVisible.value = true;
  dialogTitle.value = `编辑 ${resourceName.value}`;

  if (formData.value.电梯出厂配置表ID) {
    await searchElevators(formData.value.电梯出厂配置表ID);
  }
};

const addItem = () => {
  formData.value = {
    ID: '',
    档案盒编号: '',
    电梯出厂配置表ID: null,
    停保时间: '',
    作废时间: '',
   
    档案盒创建时间: ''
  };
  dialogVisible.value = true;
  dialogTitle.value = `新增 ${resourceName.value}`;
};

const saveForm = async () => {
  try {
    const isValid = await formRef.value?.validate();

    if (!isValid) return;

    if (formData.value.ID) {
      const { ID, 档案盒创建时间, ...rest } = formData.value;
      await axios.put(`${apiBaseUrl}/api/${resource.value}/${formData.value.ID}`, rest);
    } else {
      const { 档案盒创建时间, ...rest } = formData.value;
      await axios.post(`${apiBaseUrl}/api/${resource.value}`, rest);
    }
    dialogVisible.value = false;
    fetchData();
  } catch (error) {
    console.error('保存数据时出错:', error);
  }
};

const deleteItem = async (id: string) => {
  if (confirm('确定要删除这条记录吗？')) {
    try {
      await axios.delete(`${apiBaseUrl}/api/${resource.value}/${id}`);
      fetchData();
    } catch (error) {
      console.error('删除数据时出错:', error);
    }
  }
};

const handleSizeChange = (newSize: number) => {
  pageSize.value = newSize;
  fetchData();
};

const handleCurrentChange = (newPage: number) => {
  currentPage.value = newPage;
  fetchData();
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
/* 可按需添加更多样式 */
</style>