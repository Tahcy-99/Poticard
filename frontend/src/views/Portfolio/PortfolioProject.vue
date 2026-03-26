<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import SectionEditor from '@/components/SectionEditor.vue';
import portfolioApi from '@/api/portfolio/index';

const router = useRouter();

const title = ref('');
const period = ref('');
const role = ref('');
const heroImage = ref(null);
const imagePreview = ref(null);
const sections = ref([
    { sectionTitle: '', contents: '', sectionOrder: 1, isVisible: true }
]);
const currentSectionIndex = ref(0);
const pendingImages = ref([]);

const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
        heroImage.value = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.value = e.target.result;
        };
        reader.readAsDataURL(file);
    }
};

const addSection = () => {
    const nextOrder = sections.value.length + 1;
    sections.value.push({
        sectionTitle: '',
        contents: '',
        sectionOrder: nextOrder,
        isVisible: true
    });
 
    currentSectionIndex.value = sections.value.length - 1;
};

const selectSection = (index) => {
    currentSectionIndex.value = index;
};

// ✨ 에디터 컴포넌트에서 이미지가 추가될 때마다 호출되어 대기열에 저장
const handleSectionImageAdded = (imageData) => {
    pendingImages.value.push(imageData); // imageData 구조: { file: File객체, localUrl: 'blob:http...' }
};

const submitPortfolio = async () => {
    if (!title.value.trim()) {
        alert('프로젝트 제목을 입력해주세요.');
        return;
    }

    try {
        // ✨ 1. 최종 저장 전, 대기열(pendingImages)에 있는 에디터 이미지들을 먼저 S3에 업로드
        for (const img of pendingImages.value) {
            let isUsed = false;
            
            // 본문에 해당 이미지가 지워지지 않고 진짜로 남아있는지 검사
            for (const sec of sections.value) {
                if (sec.contents && sec.contents.includes(img.localUrl)) {
                    isUsed = true;
                    break;
                }
            }

            // 본문에 사용 중인 이미지라면 S3로 업로드
            if (isUsed) {
                const imgFormData = new FormData();
                imgFormData.append('image', img.file);
                
                // 백엔드로 업로드 요청 후 S3 URL 받아오기 (uploadImage API 호출)
                const uploadRes = await portfolioApi.uploadImage(imgFormData);
                
                // 응답 구조에 맞게 S3 URL 추출 (BaseResponse 적용 유무에 따라 조절)
                const s3Url = uploadRes.data?.result || uploadRes.data; 
                
                // 모든 섹션 본문을 순회하며 가짜 로컬 주소(blob)를 진짜 S3 주소로 치환
                for (const sec of sections.value) {
                    if (sec.contents) {
                        sec.contents = sec.contents.replaceAll(img.localUrl, s3Url);
                    }
                }
            }
        }

        // ✨ 2. 원래 있던 포트폴리오 생성 로직 수행 (이제 contents에는 S3 URL만 들어있음)
        const formData = new FormData();

        const dataPayload = {
            title: title.value,
            period: period.value,
            role: role.value,
            sectionList: sections.value,
            accentColor: null,
            fontFamily: null,
            layoutType: null
        };

        formData.append('data', new Blob([JSON.stringify(dataPayload)], {
            type: 'application/json'
        }));

        if (heroImage.value) {
            formData.append('image', heroImage.value);
        }

        const response = await portfolioApi.createPortfolio(formData);
        
        alert('성공적으로 저장되었습니다.');
  
        const newPortfolioIdx = response.data?.result || response.data; 
        
        router.push({ path: '/portfolio-update-n-check', query: { idx: newPortfolioIdx } }); 
        
    } catch (error) {
        console.error('포트폴리오 생성 실패:', error);
        alert('저장 중 오류가 발생했습니다.');
    }
};

onMounted(async () => {
});
</script>

<template>
    <div class="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans transition-colors selection:bg-yellow-200 selection:text-zinc-900 flex flex-col">
        <main class="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto w-full">
            
            <div class="mb-12 max-w-4xl mx-auto text-center">
                <div class="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-xs font-black tracking-widest mb-6 uppercase">
                    Step 01
                </div>
                <h1 class="text-3xl md:text-4xl font-black tracking-tight mb-4">프로젝트 작성하기</h1>
                <p class="text-zinc-500 dark:text-zinc-400">가장 돋보이고 싶은 프로젝트를 골라 자유롭게 구성해보세요.</p>
                
                <div class="mt-8 flex justify-center gap-2 text-sm font-bold text-zinc-300 dark:text-zinc-700">
                    <span class="text-yellow-500">작성</span>
                    <span>―</span>
                    <span>수정</span>
                    <span>―</span>
                    <span>스타일</span>
                </div>
            </div>

            <div class="max-w-4xl mx-auto">
                <div class="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-xl shadow-zinc-200/40 dark:shadow-none border border-zinc-200/60 dark:border-zinc-800 p-8 md:p-12 relative overflow-hidden">
                    <form @submit.prevent="submitPortfolio" class="space-y-12">
                        
                        <div class="space-y-6">
                            <h3 class="text-sm font-black tracking-widest text-zinc-400 flex items-center gap-2 uppercase">
                                <i class="fa-solid fa-folder-open text-yellow-500"></i> 프로젝트 기본 정보
                            </h3>
                            
                            <div class="bg-zinc-50 dark:bg-zinc-800/30 rounded-3xl p-6 md:p-8 border border-zinc-100 dark:border-zinc-800 space-y-6">
                                <div class="space-y-2">
                                    <label class="text-xs font-bold text-zinc-500 dark:text-zinc-400 ml-1">프로젝트 제목</label>
                                    <textarea v-model="title" placeholder="예: E-commerce 모바일 앱 리디자인"
                                        class="w-full px-5 py-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/10 outline-none transition-all text-zinc-900 dark:text-white resize-none h-16 shadow-sm"></textarea>
                                </div>

                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div class="space-y-2">
                                        <label class="text-xs font-bold text-zinc-500 dark:text-zinc-400 ml-1">진행 기간</label>
                                        <input v-model="period" type="text" placeholder="2023.01 - 2023.06"
                                            class="w-full px-5 py-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/10 outline-none transition-all text-zinc-900 dark:text-white shadow-sm">
                                    </div>
                                    <div class="space-y-2">
                                        <label class="text-xs font-bold text-zinc-500 dark:text-zinc-400 ml-1">한 줄 소개</label>
                                        <input v-model="role" type="text" placeholder="예: UI/UX 디자이너 담당"
                                            class="w-full px-5 py-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/10 outline-none transition-all text-zinc-900 dark:text-white shadow-sm">
                                    </div>
                                </div>

                                <div class="space-y-2">
                                    <label class="text-xs font-bold text-zinc-500 dark:text-zinc-400 ml-1">대표 이미지</label>
                                    <div class="flex items-center gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-2 shadow-sm focus-within:ring-4 focus-within:ring-yellow-400/10 focus-within:border-yellow-400 transition-all">
                                        <input type="file" accept="image/*" @change="handleImageChange"
                                            class="block w-full text-sm text-zinc-500 dark:text-zinc-400 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-yellow-100 file:text-yellow-800 hover:file:bg-yellow-200 dark:file:bg-yellow-900/30 dark:file:text-yellow-500 dark:hover:file:bg-yellow-800/40 transition-all cursor-pointer outline-none">
                                        <div v-if="imagePreview" class="w-14 h-14 shrink-0 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 mr-2 shadow-sm">
                                            <img :src="imagePreview" alt="Preview" class="w-full h-full object-cover">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="space-y-6">
                            <h3 class="text-sm font-black tracking-widest text-zinc-400 flex items-center gap-2 uppercase">
                                <i class="fa-solid fa-layer-group text-yellow-500"></i> 포트폴리오 섹션
                            </h3>

                            <div class="flex flex-col md:flex-row gap-6 bg-zinc-50 dark:bg-zinc-800/30 rounded-3xl p-6 md:p-8 border border-zinc-100 dark:border-zinc-800">
                                <aside class="flex md:flex-col gap-3 overflow-x-auto md:overflow-visible pb-2 md:pb-0 shrink-0">
                                    <button type="button" v-for="(sec, index) in sections" :key="index"
                                        @click="selectSection(index)"
                                        :class="['w-12 h-12 rounded-2xl font-black text-sm flex items-center justify-center transition-all shadow-sm shrink-0', 
                                        currentSectionIndex === index ? 'bg-yellow-400 text-zinc-900 ring-4 ring-yellow-400/20' : 'bg-white dark:bg-zinc-900 text-zinc-500 border border-zinc-200 dark:border-zinc-700 hover:border-yellow-400 hover:text-yellow-500']">
                                        {{ index + 1 }}
                                    </button>

                                    <button type="button" @click="addSection"
                                        class="w-12 h-12 rounded-2xl font-black text-xl flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all border border-dashed border-zinc-300 dark:border-zinc-600 shrink-0" title="섹션 추가">
                                        +
                                    </button>
                                </aside>

                                <main class="flex-1 space-y-6 min-w-0">
                                    <div class="space-y-2">
                                        <label class="text-xs font-bold text-zinc-500 dark:text-zinc-400 ml-1">
                                            SEC 0{{ currentSectionIndex + 1 }} 소제목
                                        </label>
                                        <input v-model="sections[currentSectionIndex].sectionTitle" type="text" placeholder="본 섹션의 간단한 별명을 지어주세요"
                                            class="w-full px-5 py-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/10 outline-none transition-all text-zinc-900 dark:text-white shadow-sm">
                                    </div>
                                    
                                    <div class="space-y-2">
                                        <label class="text-xs font-bold text-zinc-500 dark:text-zinc-400 ml-1">상세 내용 작성</label>
                                        <div class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl overflow-hidden focus-within:border-yellow-400 focus-within:ring-4 focus-within:ring-yellow-400/10 transition-all shadow-sm">
                                            
                                            <SectionEditor 
                                                :key="currentSectionIndex" 
                                                v-model="sections[currentSectionIndex].contents"
                                                @imageAdded="handleSectionImageAdded"
                                                class="w-full p-4 min-h-[300px] outline-none text-zinc-900 dark:text-white">
                                            </SectionEditor>

                                        </div>
                                    </div>
                                </main>
                            </div>
                        </div>

                        <div class="pt-8 mt-8 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                            <button type="submit"
                                class="px-10 py-4 bg-yellow-400 text-zinc-900 rounded-2xl font-black shadow-lg shadow-yellow-400/30 hover:-translate-y-1 hover:shadow-xl hover:shadow-yellow-400/40 transition-all text-center flex items-center gap-2">
                                내용 확인 및 저장하기 <i class="fa-solid fa-arrow-right"></i>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    </div>
</template>

<style scoped>
/* 커스텀 스크롤바 (가로) */
aside::-webkit-scrollbar {
  height: 6px;
}
aside::-webkit-scrollbar-track {
  background: transparent;
}
aside::-webkit-scrollbar-thumb {
  background-color: #e4e4e7;
  border-radius: 20px;
}
.dark aside::-webkit-scrollbar-thumb {
  background-color: #3f3f46;
}
</style>