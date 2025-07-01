// src/components/BodyFatCarousel.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, FlatList, Dimensions, StyleSheet, TouchableOpacity } from 'react-native';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = 80;
const ITEM_SPACING = 10;

interface BodyFatCarouselProps {
  bodyFatPercentages: number[];
  gender: string;
  initialIndex: number;
  onIndexChange: (index: number) => void;
  onCopyToBar: (value: string) => void;
}

export const BodyFatCarousel: React.FC<BodyFatCarouselProps> = ({
  bodyFatPercentages,
  gender,
  initialIndex,
  onIndexChange,
  onCopyToBar
}) => {
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (flatListRef.current && initialIndex < bodyFatPercentages.length) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: initialIndex,
          animated: false,
          viewPosition: 0.5
        });
      }, 100);
    }
  }, [initialIndex, bodyFatPercentages.length]);

  const getItemLayout = (_: any, index: number) => ({
    length: ITEM_WIDTH + ITEM_SPACING,
    offset: (ITEM_WIDTH + ITEM_SPACING) * index,
    index,
  });

  const onScrollEnd = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / (ITEM_WIDTH + ITEM_SPACING));
    
    if (index >= 0 && index < bodyFatPercentages.length) {
      onIndexChange(index);
    }
  };

  const getBackgroundColor = (percentage: number) => {
    const minValue = gender === 'Male' ? 8 : 15;
    const maxValue = 60;
    
    if (percentage <= minValue + 5) {
      return '#4CAF50'; // Green - Very lean
    } else if (percentage <= minValue + 15) {
      return '#8BC34A'; // Light green - Lean
    } else if (percentage <= minValue + 25) {
      return '#FFEB3B'; // Yellow - Average
    } else if (percentage <= minValue + 35) {
      return '#FF9800'; // Orange - Above average
    } else {
      return '#F44336'; // Red - High
    }
  };

  const renderItem = ({ item, index }: { item: number; index: number }) => {
    const isSelected = index === initialIndex;
    
    return (
      <TouchableOpacity
        style={[
          styles.carouselItem,
          {
            backgroundColor: getBackgroundColor(item),
            transform: [{ scale: isSelected ? 1.1 : 1 }],
            opacity: isSelected ? 1 : 0.7,
          }
        ]}
        onPress={() => onCopyToBar(item.toString())}
        activeOpacity={0.7}
      >
        <Text style={styles.carouselText}>{item}%</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.instruction}>Swipe to select body fat percentage</Text>
      <View style={styles.carouselContainer}>
        <View style={styles.centerIndicator} />
        <FlatList
          ref={flatListRef}
          data={bodyFatPercentages}
          renderItem={renderItem}
          keyExtractor={(item) => item.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.flatListContent}
          snapToInterval={ITEM_WIDTH + ITEM_SPACING}
          decelerationRate="fast"
          onMomentumScrollEnd={onScrollEnd}
          getItemLayout={getItemLayout}
          initialScrollIndex={initialIndex}
          onScrollToIndexFailed={(info) => {
            console.warn('ScrollToIndexFailed:', info);
          }}
        />
      </View>
      <Text style={styles.copyInstruction}>Tap on a value to copy to input field</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  instruction: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666666',
    marginBottom: 10,
  },
  carouselContainer: {
    height: 80,
    position: 'relative',
    justifyContent: 'center',
  },
  centerIndicator: {
    position: 'absolute',
    left: width / 2 - 2,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#FFB347',
    borderRadius: 2,
    zIndex: 1,
  },
  flatListContent: {
    paddingHorizontal: width / 2 - ITEM_WIDTH / 2,
  },
  carouselItem: {
    width: ITEM_WIDTH,
    height: 60,
    marginHorizontal: ITEM_SPACING / 2,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  carouselText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  copyInstruction: {
    textAlign: 'center',
    fontSize: 12,
    color: '#888888',
    marginTop: 10,
    fontStyle: 'italic',
  },
});