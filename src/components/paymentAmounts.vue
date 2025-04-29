<template>
  <div>
    <el-card>
      <template #header>
        <h1>{{ resourceName }} 管理</h1>
      </template>
      <el-row>
        <el-col :span="12">
          <el-input v-model="searchQuery" placeholder="搜索维保合同ID" @input="search" clearable />
        </el-col>
        <el-col :span="6">
          <el-button @click="exportData">导出数据</el-button>
        </el-col>
        <el-col :span="6">
          <el-button type="primary" @click="addItem">新增收款记录</el-button>
        </el-col>
      </el-row>
      <el-table :data="data" stripe>
        <el-table-column prop="ID" label="收款ID" />
        <el-table-column prop="维保合同ID" label="维保合同ID" />
        <el-table-column prop="收款金额" label="收款金额" />
        <el-table-column prop="收款创建时间" label="收款创建时间" />
        <el-table-column prop="维保编号" label="维保编号" />
        <el-table-column prop="使用单位" label="使用单位" />
        <el-table-column prop="维保金额" label="维保金额" />
        <el-table-column prop="签订时间" label="签订时间" />
        <el-table-column prop="维保类型" label="维保类型" />
        <el-table-column prop="结算方式" label="结算方式" />
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
      <el-form :model="formData" label-width="120px" :rules="rules" ref="formRef">
        <el-form-item label="维保合同ID" prop="维保合同ID">
          <el-select
            v-model="formData.维保合同ID"
            placeholder="请选择维保合同"
            filterable
            remote
            :remote-method="searchContracts"
            loading-text="加载中..."
          >
            <el-option
              v-for="contract in contractOptions"
              :key="contract.ID"
              :label="`${contract.维保编号} - ${contract.使用单位}`"
              :value="contract.ID"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="金额" prop="金额">
          <el-input v-model="formData.金额" placeholder="请输入金额" />
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
import { ref, onMounted, watch } from 'vue';
import axios from 'axios';
import { ElForm } from 'element-plus';

// 定义接口
interface Resource {
  ID: string;
  '维保合同ID': string;
  '收款金额': string;
  '收款创建时间': string;
  '维保编号': string;
  '使用单位': string;
  '维保金额': string;
  '签订时间': string;
  '维保类型': string;
  '结算方式': string;
  [key: string]: string | undefined; // 添加索引签名
}

interface Column {
  prop: string;
  label: string;
}

const apiBaseUrl = 'http://localhost:3000';

const resource = ref('paymentAmounts');
const resourceName = ref('收款金额表');

const columns = ref<Column[]>([
  { prop: 'ID', label: '收款ID' },
  { prop: '维保合同ID', label: '维保合同ID' },
  { prop: '收款金额', label: '收款金额' },
  { prop: '收款创建时间', label: '收款创建时间' },
  { prop: '维保编号', label: '维保编号' },
  { prop: '使用单位', label: '使用单位' },
  { prop: '维保金额', label: '维保金额' },
  { prop: '签订时间', label: '签订时间' },
  { prop: '维保类型', label: '维保类型' },
  { prop: '结算方式', label: '结算方式' }
]);
const data = ref<Resource[]>([]);
const searchQuery = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const totalCount = ref(0);
const dialogVisible = ref(false);
const formData = ref<Resource>({
  ID: '',
  '维保合同ID': '',
  '收款金额': '',
  '收款创建时间': '',
  '维保编号': '',
  '使用单位': '',
  '维保金额': '',
  '签订时间': '',
  '维保类型': '',
  '结算方式': ''
});
const dialogTitle = ref('');
const formRef = ref<InstanceType<typeof ElForm>>();
const contractOptions = ref<Resource[]>([]);
const searchContractsQuery = ref('');

const rules = {
  '维保合同ID': [{ required: true, message: '维保合同ID不能为空', trigger: 'blur' }],
  '收款金额': [{ required: true, message: '金额不能为空', trigger: 'blur' }]
};

const fetchData = async () => {
  try {
    const response = await axios.get<Record<string, any>>(`${apiBaseUrl}/api/${resource.value}`, {
      params: {
        page: currentPage.value,
        limit: pageSize.value,
        q: searchQuery.value
      }
    });
    data.value = response.data.data as Resource[];
    totalCount.value = response.data.totalCount;
  } catch (error) {
    console.error('获取数据时出错:', error);
  }
};

const fetchContracts = async (params?: any) => {
  try {
    const response = await axios.get(`${apiBaseUrl}/api/maintenanceContracts/select`, { params });
    contractOptions.value = response.data.data as Resource[];
  } catch (error) {
    console.error('获取维保合同数据时出错:', error);
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

const editItem = (item: Resource) => {
  formData.value = { ...item };
  dialogVisible.value = true;
  dialogTitle.value = `编辑 ${resourceName.value}`;
};

const addItem = () => {
  formData.value = {
    ID: '',
    '维保合同ID': '',
    '收款金额': '',
    '收款创建时间': '',
    '维保编号': '',
    '使用单位': '',
    '维保金额': '',
    '签订时间': '',
    '维保类型': '',
    '结算方式': ''
  };
  dialogVisible.value = true;
  dialogTitle.value = `新增 ${resourceName.value}`;
};

const saveForm = async () => {
  try {
    const isValid = await formRef.value?.validate();
    if (!isValid) return;

    if (formData.value.ID) {
      const { ID, '收款创建时间': 收款创建时间, ...rest } = formData.value;
      await axios.put(`${apiBaseUrl}/api/${resource.value}/${formData.value.ID}`, rest);
    } else {
      const { '收款创建时间': 收款创建时间, ...rest } = formData.value;
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

const searchContracts = async (query: string) => {
  if (query) {
    fetchContracts({
      q: query,
      page: 1,
      limit: 100
    });
  } else {
    fetchContracts();
  }
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
/* 可按需添加更多样式 */
</style>