import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
  Modal,
  Platform,
} from 'react-native';

import Reanimated, { useSharedValue, useAnimatedStyle, runOnJS } from 'react-native-reanimated';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CropModalProps {
  visible: boolean;
  imageUri: string;
  onCancel: () => void;
  onCropSave: (croppedUri: string) => void;
}

export const CropModal = ({ visible, imageUri, onCancel, onCropSave }: CropModalProps) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [imageSize, setImageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const cropX = useSharedValue<number>(0);
  const cropY = useSharedValue<number>(0);
  const cropWidth = useSharedValue<number>(0);
  const cropHeight = useSharedValue<number>(0);
  
  const cropRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const syncCropRef = (x: number, y: number, w: number, h: number) => {
    cropRef.current = { x, y, width: w, height: h };
  };
  
  const MIN_CROP_SIZE = 20;
  const IMG_PADDING = 16;
  const maxImgW = SCREEN_WIDTH - IMG_PADDING * 2;
  const maxImgH = SCREEN_HEIGHT * 0.7; // Bounding height to 70% of screen
  
  const imgRatio = imageSize.height ? imageSize.width / imageSize.height : 1;
  
  let renderedW = maxImgW;
  let renderedH = imageSize.height ? maxImgW / imgRatio : maxImgW;

  // Scale down if height exceeds maxImgH (Standard Contain logic)
  if (renderedH > maxImgH) {
    renderedH = maxImgH;
    renderedW = maxImgH * imgRatio;
  }

  useEffect(() => {
    let isMounted = true;
    if (visible && imageUri) {
      Image.getSize(
        imageUri,
        (w: number, h: number) => { if (isMounted) setImageSize({ width: w, height: h }); },
        () => {
          ImageManipulator.manipulateAsync(imageUri, [])
            .then(res => { if (isMounted) setImageSize({ width: res.width, height: res.height }); })
            .catch(() => { if (isMounted) setImageSize({ width: 1000, height: 1000 }); });
        }
      );
    }
    return () => { isMounted = false; };
  }, [visible, imageUri]);

  useEffect(() => {
    if (visible && renderedW > 0 && renderedH > 0) {
      const initW = renderedW * 0.8;
      const initH = renderedH * 0.8;
      cropWidth.value = initW;
      cropHeight.value = initH;
      cropX.value = (renderedW - initW) / 2;
      cropY.value = (renderedH - initH) / 2;
      cropRef.current = { x: (renderedW - initW) / 2, y: (renderedH - initH) / 2, width: initW, height: initH };
    }
  }, [visible, imageSize, renderedW, renderedH]);

  const dragGesture = Gesture.Pan()
    .onChange((event) => {
      'worklet';
      let newX = cropX.value + event.changeX;
      let newY = cropY.value + event.changeY;
      cropX.value = Math.max(0, Math.min(newX, renderedW - cropWidth.value));
      cropY.value = Math.max(0, Math.min(newY, renderedH - cropHeight.value));
      runOnJS(syncCropRef)(cropX.value, cropY.value, cropWidth.value, cropHeight.value);
    });

  const resizeBR = Gesture.Pan().onChange((event) => {
    'worklet';
    let changeW = event.changeX;
    let changeH = event.changeY;
    let maxExpandW = renderedW - (cropX.value + cropWidth.value);
    let maxExpandH = renderedH - (cropY.value + cropHeight.value);
    if (changeW > 0) changeW = Math.min(changeW, maxExpandW);
    if (changeH > 0) changeH = Math.min(changeH, maxExpandH);
    if (cropWidth.value + changeW < MIN_CROP_SIZE) changeW = MIN_CROP_SIZE - cropWidth.value;
    if (cropHeight.value + changeH < MIN_CROP_SIZE) changeH = MIN_CROP_SIZE - cropHeight.value;
    cropWidth.value += changeW;
    cropHeight.value += changeH;
    runOnJS(syncCropRef)(cropX.value, cropY.value, cropWidth.value, cropHeight.value);
  });

  const resizeTL = Gesture.Pan().onChange((event) => {
    'worklet';
    let changeW = -event.changeX;
    let changeH = -event.changeY;
    let maxExpandW = cropX.value;
    let maxExpandH = cropY.value;
    if (changeW > 0) changeW = Math.min(changeW, maxExpandW);
    if (changeH > 0) changeH = Math.min(changeH, maxExpandH);
    if (cropWidth.value + changeW < MIN_CROP_SIZE) changeW = MIN_CROP_SIZE - cropWidth.value;
    if (cropHeight.value + changeH < MIN_CROP_SIZE) changeH = MIN_CROP_SIZE - cropHeight.value;
    cropX.value -= changeW;
    cropY.value -= changeH;
    cropWidth.value += changeW;
    cropHeight.value += changeH;
    runOnJS(syncCropRef)(cropX.value, cropY.value, cropWidth.value, cropHeight.value);
  });

  const resizeTR = Gesture.Pan().onChange((event) => {
    'worklet';
    let changeW = event.changeX;
    let changeH = -event.changeY;
    let maxExpandW = renderedW - (cropX.value + cropWidth.value);
    let maxExpandH = cropY.value;
    if (changeW > 0) changeW = Math.min(changeW, maxExpandW);
    if (changeH > 0) changeH = Math.min(changeH, maxExpandH);
    if (cropWidth.value + changeW < MIN_CROP_SIZE) changeW = MIN_CROP_SIZE - cropWidth.value;
    if (cropHeight.value + changeH < MIN_CROP_SIZE) changeH = MIN_CROP_SIZE - cropHeight.value;
    cropY.value -= changeH;
    cropWidth.value += changeW;
    cropHeight.value += changeH;
    runOnJS(syncCropRef)(cropX.value, cropY.value, cropWidth.value, cropHeight.value);
  });

  const resizeBL = Gesture.Pan().onChange((event) => {
    'worklet';
    let changeW = -event.changeX;
    let changeH = event.changeY;
    let maxExpandW = cropX.value;
    let maxExpandH = renderedH - (cropY.value + cropHeight.value);
    if (changeW > 0) changeW = Math.min(changeW, maxExpandW);
    if (changeH > 0) changeH = Math.min(changeH, maxExpandH);
    if (cropWidth.value + changeW < MIN_CROP_SIZE) changeW = MIN_CROP_SIZE - cropWidth.value;
    if (cropHeight.value + changeH < MIN_CROP_SIZE) changeH = MIN_CROP_SIZE - cropHeight.value;
    cropX.value -= changeW;
    cropWidth.value += changeW;
    cropHeight.value += changeH;
    runOnJS(syncCropRef)(cropX.value, cropY.value, cropWidth.value, cropHeight.value);
  });

  const resizeTop = Gesture.Pan().onChange((event) => {
    'worklet';
    let change = -event.changeY;
    let maxExpand = cropY.value;
    if (change > 0) change = Math.min(change, maxExpand);
    if (cropHeight.value + change < MIN_CROP_SIZE) change = MIN_CROP_SIZE - cropHeight.value;
    cropY.value -= change;
    cropHeight.value += change;
    runOnJS(syncCropRef)(cropX.value, cropY.value, cropWidth.value, cropHeight.value);
  });

  const resizeBottom = Gesture.Pan().onChange((event) => {
    'worklet';
    let change = event.changeY;
    let maxExpand = renderedH - (cropY.value + cropHeight.value);
    if (change > 0) change = Math.min(change, maxExpand);
    if (cropHeight.value + change < MIN_CROP_SIZE) change = MIN_CROP_SIZE - cropHeight.value;
    cropHeight.value += change;
    runOnJS(syncCropRef)(cropX.value, cropY.value, cropWidth.value, cropHeight.value);
  });

  const resizeLeft = Gesture.Pan().onChange((event) => {
    'worklet';
    let change = -event.changeX;
    let maxExpand = cropX.value;
    if (change > 0) change = Math.min(change, maxExpand);
    if (cropWidth.value + change < MIN_CROP_SIZE) change = MIN_CROP_SIZE - cropWidth.value;
    cropX.value -= change;
    cropWidth.value += change;
    runOnJS(syncCropRef)(cropX.value, cropY.value, cropWidth.value, cropHeight.value);
  });

  const resizeRight = Gesture.Pan().onChange((event) => {
    'worklet';
    let change = event.changeX;
    let maxExpand = renderedW - (cropX.value + cropWidth.value);
    if (change > 0) change = Math.min(change, maxExpand);
    if (cropWidth.value + change < MIN_CROP_SIZE) change = MIN_CROP_SIZE - cropWidth.value;
    cropWidth.value += change;
    runOnJS(syncCropRef)(cropX.value, cropY.value, cropWidth.value, cropHeight.value);
  });

  const cropBoxStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: cropX.value }, { translateY: cropY.value }],
    width: cropWidth.value,
    height: cropHeight.value,
  }));

  const resizeStyleTL = useAnimatedStyle(() => ({
    transform: [{ translateX: cropX.value - 15 }, { translateY: cropY.value - 15 }],
  }));

  const resizeStyleTR = useAnimatedStyle(() => ({
    transform: [{ translateX: cropX.value + cropWidth.value - 15 }, { translateY: cropY.value - 15 }],
  }));

  const resizeStyleBL = useAnimatedStyle(() => ({
    transform: [{ translateX: cropX.value - 15 }, { translateY: cropY.value + cropHeight.value - 15 }],
  }));

  const resizeStyleBR = useAnimatedStyle(() => ({
    transform: [{ translateX: cropX.value + cropWidth.value - 15 }, { translateY: cropY.value + cropHeight.value - 15 }],
  }));

  const resizeStyleTop = useAnimatedStyle(() => ({
    transform: [{ translateX: cropX.value + 15 }, { translateY: cropY.value - 15 }],
    width: Math.max(0, cropWidth.value - 30),
  }));

  const resizeStyleBottom = useAnimatedStyle(() => ({
    transform: [{ translateX: cropX.value + 15 }, { translateY: cropY.value + cropHeight.value - 15 }],
    width: Math.max(0, cropWidth.value - 30),
  }));

  const resizeStyleLeft = useAnimatedStyle(() => ({
    transform: [{ translateX: cropX.value - 15 }, { translateY: cropY.value + 15 }],
    height: Math.max(0, cropHeight.value - 30),
  }));

  const resizeStyleRight = useAnimatedStyle(() => ({
    transform: [{ translateX: cropX.value + cropWidth.value - 15 }, { translateY: cropY.value + 15 }],
    height: Math.max(0, cropHeight.value - 30),
  }));

  const gridLineStyleH = useAnimatedStyle(() => ({
    opacity: cropHeight.value > 45 ? 1 : 0,
  }));

  const gridLineStyleV = useAnimatedStyle(() => ({
    opacity: cropWidth.value > 45 ? 1 : 0,
  }));

  const handleBarHStyle = useAnimatedStyle(() => ({
    opacity: cropWidth.value > 40 ? 1 : 0,
  }));

  const handleBarVStyle = useAnimatedStyle(() => ({
    opacity: cropHeight.value > 40 ? 1 : 0,
  }));

  const topOverlay = useAnimatedStyle(() => ({ height: cropY.value }));
  const bottomOverlay = useAnimatedStyle(() => ({ top: cropY.value + cropHeight.value }));
  const leftOverlay = useAnimatedStyle(() => ({ top: cropY.value, width: cropX.value, height: cropHeight.value }));
  const rightOverlay = useAnimatedStyle(() => ({ top: cropY.value, left: cropX.value + cropWidth.value, height: cropHeight.value }));

  const handleSave = async () => {
    setLoading(true);
    try {
      const normalizedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [], 
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      );

      const trueWidth = normalizedImage.width;
      const trueHeight = normalizedImage.height;

      const scaleX = trueWidth / renderedW;
      const scaleY = trueHeight / renderedH;

      const { x: cx, y: cy, width: cw, height: ch } = cropRef.current;
      
      let originX = Math.round(cx * scaleX);
      let originY = Math.round(cy * scaleY);
      let cropWidth = Math.round(cw * scaleX);
      let cropHeight = Math.round(ch * scaleY);

      originX = Math.max(0, originX);
      originY = Math.max(0, originY);
      if (originX + cropWidth > trueWidth) cropWidth = trueWidth - originX;
      if (originY + cropHeight > trueHeight) cropHeight = trueHeight - originY;

      if (cropWidth <= 0 || cropHeight <= 0) {
        onCancel();
        return;
      }

      const manipResult = await ImageManipulator.manipulateAsync(
        normalizedImage.uri,
        [{ crop: { originX, originY, width: cropWidth, height: cropHeight } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      onCropSave(manipResult.uri);
    } catch (e) {
      console.error("Crop error:", e);
      Alert.alert("Error", "Could not crop image. Please try another.");
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="slide">
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#111' }}>
        <View style={{ flex: 1, paddingTop: Platform.OS === 'android' ? 40 : 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 20 }}>
            <TouchableOpacity onPress={onCancel} style={{ padding: 10, marginLeft: -10 }}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} disabled={loading} style={{ padding: 10, marginRight: -10 }}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Save</Text>}
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: renderedW, height: renderedH, position: 'relative' }}>
              <Image source={{ uri: imageUri }} style={{ width: renderedW, height: renderedH }} resizeMode="contain" />

              <Reanimated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.55)' }, topOverlay]} pointerEvents="none" />
              <Reanimated.View style={[{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)' }, bottomOverlay]} pointerEvents="none" />
              <Reanimated.View style={[{ position: 'absolute', left: 0, backgroundColor: 'rgba(0,0,0,0.55)' }, leftOverlay]} pointerEvents="none" />
              <Reanimated.View style={[{ position: 'absolute', right: 0, backgroundColor: 'rgba(0,0,0,0.55)' }, rightOverlay]} pointerEvents="none" />

              <GestureDetector gesture={dragGesture}>
                <Reanimated.View style={[{ position: 'absolute', borderWidth: 2, borderColor: '#fff' }, cropBoxStyle]}>
                  <Reanimated.View style={[{ position: 'absolute', top: '33.33%', left: 0, right: 0, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }, gridLineStyleH]} pointerEvents="none" />
                  <Reanimated.View style={[{ position: 'absolute', top: '66.66%', left: 0, right: 0, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }, gridLineStyleH]} pointerEvents="none" />
                  <Reanimated.View style={[{ position: 'absolute', top: 0, bottom: 0, left: '33.33%', borderLeftWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }, gridLineStyleV]} pointerEvents="none" />
                  <Reanimated.View style={[{ position: 'absolute', top: 0, bottom: 0, left: '66.66%', borderLeftWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }, gridLineStyleV]} pointerEvents="none" />
                  

                </Reanimated.View>
              </GestureDetector>

              <GestureDetector gesture={resizeTL}>
                <Reanimated.View style={[{ position: 'absolute', width: 30, height: 30, zIndex: 10, top: 0, left: 0 }, resizeStyleTL]}>
                   <View style={styles.handleDot} />
                </Reanimated.View>
              </GestureDetector>

              <GestureDetector gesture={resizeTR}>
                <Reanimated.View style={[{ position: 'absolute', width: 30, height: 30, zIndex: 10, top: 0, left: 0 }, resizeStyleTR]}>
                   <View style={styles.handleDot} />
                </Reanimated.View>
              </GestureDetector>

              <GestureDetector gesture={resizeBL}>
                <Reanimated.View style={[{ position: 'absolute', width: 30, height: 30, zIndex: 10, top: 0, left: 0 }, resizeStyleBL]}>
                   <View style={styles.handleDot} />
                </Reanimated.View>
              </GestureDetector>

              <GestureDetector gesture={resizeBR}>
                <Reanimated.View style={[{ position: 'absolute', width: 30, height: 30, zIndex: 10, top: 0, left: 0 }, resizeStyleBR]}>
                   <View style={styles.handleDot} />
                </Reanimated.View>
              </GestureDetector>

              <GestureDetector gesture={resizeTop}>
                <Reanimated.View style={[{ position: 'absolute', height: 30, zIndex: 9, top: 0, left: 0, justifyContent: 'center', alignItems: 'center' }, resizeStyleTop]}>
                   <Reanimated.View style={[styles.handleBarHoriz, handleBarHStyle]} />
                </Reanimated.View>
              </GestureDetector>

              <GestureDetector gesture={resizeBottom}>
                <Reanimated.View style={[{ position: 'absolute', height: 30, zIndex: 9, top: 0, left: 0, justifyContent: 'center', alignItems: 'center' }, resizeStyleBottom]}>
                   <Reanimated.View style={[styles.handleBarHoriz, handleBarHStyle]} />
                </Reanimated.View>
              </GestureDetector>

              <GestureDetector gesture={resizeLeft}>
                <Reanimated.View style={[{ position: 'absolute', width: 30, zIndex: 9, top: 0, left: 0, justifyContent: 'center', alignItems: 'center' }, resizeStyleLeft]}>
                   <Reanimated.View style={[styles.handleBarVert, handleBarVStyle]} />
                </Reanimated.View>
              </GestureDetector>

              <GestureDetector gesture={resizeRight}>
                <Reanimated.View style={[{ position: 'absolute', width: 30, zIndex: 9, top: 0, left: 0, justifyContent: 'center', alignItems: 'center' }, resizeStyleRight]}>
                   <Reanimated.View style={[styles.handleBarVert, handleBarVStyle]} />
                </Reanimated.View>
              </GestureDetector>
            </View>
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  handleDot: {
    position: 'absolute',
    top: 9, 
    left: 9,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#444',
  },
  handleBarHoriz: {
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: '#444',
  },
  handleBarVert: {
    width: 4,
    height: 24,
    borderRadius: 2,
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: '#444',
  },
});
