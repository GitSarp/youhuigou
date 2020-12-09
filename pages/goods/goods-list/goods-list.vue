<template>
	<view>
		<view class="header" :style="{position:headerPosition,top:headerTop}">
			<!-- 搜索框 -->
			<view v-if="!isEmpty(search)" class="input-box">
				<input placeholder="默认关键字" placeholder-style="color:#c0c0c0;" @confirm="reload()" v-model="search" />
				<view class="icon search"></view>
			</view>
			<view class="target" v-if="!isEmpty(search)" v-for="(target,index) in orderbyList" @tap="select(index)" :key="index" :class="[target.selected?'on':'']">
				{{target.text}}
				<view v-if="target.orderbyicon" class="icon" :class="target.orderbyicon[target.orderby]"></view>
			</view>
		</view>
		<!-- 占位 -->
		<view class="place"></view>
		<!-- 商品列表 -->
		<view v-if="!isEmpty(search)" class="goods-list">
			<view class="product-list">
				<view class="product" v-for="(goods,index) in goodsList" :key="index" @tap="toGoods(goods)">
					<image mode="widthFix" :src="goods.pictUrl"></image>
					<view class="name">{{goods.title}}</view>
					<view class="info">
						<view class="price">{{goods.zkFinalPrice}}</view>
						<view class="slogan">{{goods.provcity}}</view>
					</view>
				</view>
			</view>
			<view class="loading-text">{{loadingText}}</view>
		</view>
		
		<view v-if="!isEmpty(materialId)" class="goods-list">
			<view class="product-list">
				<view class="product" v-for="(goods,index) in optGoodsList" :key="index" @tap="toGoods(goods)">
					<image mode="widthFix" :src="goods.pictUrl"></image>
					<view class="name">{{goods.title}}</view>
					<view class="info">
						<view class="price">{{goods.zkFinalPrice}}</view>
						<view class="slogan">优惠券:{{goods.couponAmount}}￥</view>
					</view>
				</view>
			</view>
			<view class="loading-text">{{loadingText}}</view>
		</view>
	</view>
</template>

<script>
	import helper from "@/common/header.js";
	export default {
		data() {
			return {
				goodsList: [],
				optGoodsList: [],
				loadingText: "正在加载...",
				headerTop: "0px",
				headerPosition: "fixed",
				orderbyList: [{
						text: "销量",
						selected: true,
						orderbyicon: false,
						orderby: 1,
						propertyName: "total_sales"
					},
					{
						text: "价格",
						selected: false,
						orderbyicon: ['sheng', 'jiang'],
						orderby: 0,
						propertyName: "price"
					},
					{
						text: "好评",
						selected: false,
						orderbyicon: false,
						orderby: 1,
						propertyName: "tk_total_sales"
					}
				],
				orderby: "sheng",
				search: "",
				materialId: "",
				//总页数
				pages: 1,
				pageNo: 1,
				pageSize: 20,
				cid: "",
				//是否已加载全部商品，默认否
				isLoad: false,
				//默认销量降序
				sort: 'total_sales_des'
			};
		},
		onLoad: function(option) { //option为object类型，会序列化上个页面传递的参数
			//console.log(option.cid); //打印出上个页面传递的参数。
			this.cid = option.cid;
			let title = this.isEmpty(option.search) ? option.materialName:option.search;
			uni.setNavigationBarTitle({
				title: title
			});
			this.search = option.search;
			this.materialId = option.materialId;
			//兼容H5下排序栏位置
			// #ifdef H5
			//定时器方式循环获取高度为止，这么写的原因是onLoad中head未必已经渲染出来。
			let Timer = setInterval(() => {
				let uniHead = document.getElementsByTagName('uni-page-head');
				if (uniHead.length > 0) {
					this.headerTop = uniHead[0].offsetHeight + 'px';
					clearInterval(Timer); //清除定时器
				}
			}, 1);
			// #endif
			//获取商品信息
			this.getGoodsList();
		},
		onPageScroll(e) {
			//兼容iOS端下拉时顶部漂移
			if (e.scrollTop >= 0) {
				this.headerPosition = "fixed";
			} else {
				this.headerPosition = "absolute";
			}
		},
		//下拉刷新，需要自己在page.json文件中配置开启页面下拉刷新 "enablePullDownRefresh": true
		onPullDownRefresh() {
			setTimeout(() => {
				this.reload();
				uni.stopPullDownRefresh();
			}, 1000);
		},
		//上拉加载，需要自己在page.json文件中配置"onReachBottomDistance"
		onReachBottom() {
			//uni.showToast({title: '触发上拉加载'});
			if(this.isLoad){
				//再拉一次数据（不增加pageNo），排除网络原因没有数据返回造成的，伪加载完毕
				this.getGoodsList();
			}
			if (this.isLoad) {
				this.loadingText = "到底了";
				return false;
			} else {
				this.loadingText = "正在加载...";
				this.setReachBottom();
			}
		},
		methods: {
			reload() {
				this.getGoodsList(true)
			},
			getGoodsList(refresh) {
				if (refresh) {
					//搜索重新刷新页面
					this.pageNo = 1;
					this.goodsList = [];
				}
				
				let header = helper.getHeader();
				if(!this.isEmpty(this.search)){
					//通用搜索接口
					uni.request({
						//todo 测试代码
						//url: 'http://localhost:8080/wechat/goods/list',
						url: '/wechat/goods/list',
						header: header,
						data: {
							qry: this.search,
							//todo 
							//cat: this.cid,
							pageNo: this.pageNo,
							sort: this.sort
						},
						success: (res) => {
							res = res.data
							if (res.resultList && res.resultList.length > 0) {
								this.goodsList = this.goodsList.concat(res.resultList)
								//总页数
								this.pages = res.totalCount / this.pageSize
								this.isLoad = false
							}else{
								this.isLoad = true
							}
						}
					})
				}else if(!this.isEmpty(this.materialId)){
					//物料精选接口
					uni.request({
						//todo 测试代码
						//url: 'http://localhost:8080/wechat/goods/optimus',
						url: '/wechat/goods/optimus',
						header: header,
						data: {
							materialId: this.materialId,
							pageNo: this.pageNo
						},
						success: (res) => {
							res = res.data
							console.log(res);
							if (res.resultList && res.resultList.length > 0) {
								this.optGoodsList = this.optGoodsList.concat(res.resultList)
								//总页数
								this.pages = res.totalCount / this.pageSize
								this.isLoad = false
							} else {
								this.isLoad = true
							}
						}
					})
				}
			},
			//触底了
			setReachBottom() {
				this.pageNo++;
				this.getGoodsList();
			},
			//商品跳转
			toGoods(e) {
				//uni.showToast({title: '商品'+e.goods_id,icon:"none"});
				let goodsId = this.isEmpty(e.numIid) ? e.itemId:e.numIid;
				this.getTpwdAndGo(e.title, e.couponShareUrl, goodsId)
			},
			//获取淘口令
			getTpwdAndGo(text, url, numIid){
				//物料精选接口
				let header = helper.getHeader();
				uni.request({
					//todo 测试代码
					//url: 'http://localhost:8080/wechat/goods/tpwd',
					url: '/wechat/goods/tpwd',
					header: header,
					data: {
						url: 'https:'+url,
						text: text
					},
					success: (res) => {
						//成功再进入详情页
						uni.navigateTo({
							url: '../goods?numIid=' + numIid+'&tpwd='+res.data
						});
					},
					fail: (err) => {
						console.error('获取淘口令失败:'+err)
						uni.showToast({
							title: '宝贝暂时无法查看，请刷新后重试'
						})
					}
				});
			},
			isEmpty(obj){
			    if(typeof obj == "undefined" || obj == null || obj == ""){
			        return true;
			    }else{
			        return false;
			    }
			},
			//排序类型
			select(index) {
				let tmpTis = this.orderbyList[index].text + "排序 "
				if (this.orderbyList[index].orderbyicon) {
					let type = this.orderbyList[index].orderby == 0 ? '升序' : '降序';
					if (this.orderbyList[index].selected) {
						type = this.orderbyList[index].orderby == 0 ? '降序' : '升序';
						this.orderbyList[index].orderby = this.orderbyList[index].orderby == 0 ? 1 : 0;
					}
					tmpTis += type
				}
				this.orderbyList[index].selected = true;
				let len = this.orderbyList.length;
				for (let i = 0; i < len; i++) {
					if (i != index) {
						this.orderbyList[i].selected = false;
					}
				}
				//uni.showToast({title:tmpTis,icon:"none"});

				//排序
				let srt = this.orderbyList[index].orderby == 0 ? '_asc' : '_des';
				this.sort = this.orderbyList[index].propertyName + srt;
				this.reload();
			}
		}

	}
</script>

<style lang="scss">
	.icon {
		font-size: 26upx;
	}

	.header {
		width: 92%;
		padding: 0 4%;
		height: 79upx;
		display: flex;
		justify-content: space-around;
		align-items: flex-end;
		position: fixed;
		top: 0;
		z-index: 10;
		background-color: #fff;
		border-bottom: solid 1upx #eee;

		.target {
			width: 20%;
			height: 60upx;
			display: flex;
			justify-content: center;
			align-items: center;
			font-size: 28upx;
			margin-bottom: -2upx;
			color: #aaa;

			&.on {
				color: #555;
				border-bottom: 4upx solid #f06c7a;
				font-weight: 600;
				font-size: 30upx;
			}


		}
	}

	.place {

		background-color: #ffffff;
		height: 100upx;

	}

	.goods-list {
		.loading-text {
			width: 100%;
			display: flex;
			justify-content: center;
			align-items: center;
			height: 60upx;
			color: #979797;
			font-size: 24upx;
		}

		.product-list {
			width: 92%;
			padding: 0 4% 3vw 4%;
			display: flex;
			justify-content: space-between;
			flex-wrap: wrap;

			.product {
				width: 48%;
				border-radius: 20upx;
				background-color: #fff;
				margin: 0 0 15upx 0;
				box-shadow: 0upx 5upx 25upx rgba(0, 0, 0, 0.1);

				image {
					width: 100%;
					border-radius: 20upx 20upx 0 0;
				}

				.name {
					width: 92%;
					padding: 10upx 4%;
					display: -webkit-box;
					-webkit-box-orient: vertical;
					-webkit-line-clamp: 2;
					text-align: justify;
					overflow: hidden;
					font-size: 30upx;
				}

				.info {
					display: flex;
					justify-content: space-between;
					align-items: flex-end;
					width: 92%;
					padding: 10upx 4% 10upx 4%;

					.price {
						color: #e65339;
						font-size: 30upx;
						font-weight: 600;
					}

					.slogan {
						color: #807c87;
						font-size: 24upx;
					}
				}
			}

		}
	}
</style>
