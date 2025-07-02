// src/components/BodyFatCarousel.tsx - Zjednodušená verze inspirovaná původní .txt verzí
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, Dimensions, StyleSheet, TouchableOpacity, Image } from 'react-native';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = 120;
const ITEM_SPACING = 20;

interface BodyFatCarouselProps {
  bodyFatPercentages: number[];
  gender: string;
  initialIndex: number;
  onIndexChange: (index: number) => void;
  onCopyToBar: (value: string) => void;
  inputValue?: string; // NOVÝ PROP pro input hodnotu
}

// Image mapping for body fat percentages
const getBodyFatImage = (percentage: number, gender: string) => {
  try {
    if (gender.toLowerCase() === 'male') {
      switch (percentage) {
        case 8: return require('../assets/images/body-fat/male/8BF.png');
        case 12: return require('../assets/images/body-fat/male/12BF.png');
        case 15: return require('../assets/images/body-fat/male/15BF.png');
        case 20: return require('../assets/images/body-fat/male/20BF.png');
        case 25: return require('../assets/images/body-fat/male/25BF.png');
        case 30: return require('../assets/images/body-fat/male/30BF.png');
        case 35: return require('../assets/images/body-fat/male/35BF.png');
        default: return require('../assets/images/body-fat/male/20BF.png');
      }
    } else {
      switch (percentage) {
        case 15: return require('../assets/images/body-fat/female/15BFf.png');
        case 20: return require('../assets/images/body-fat/female/20BFf.png');
        case 25: return require('../assets/images/body-fat/female/25BFf.png');
        case 30: return require('../assets/images/body-fat/female/30BFf.png');
        case 35: return require('../assets/images/body-fat/female/35BFf.png');
        case 40: return require('../assets/images/body-fat/female/40BFf.png');
        case 45: return require('../assets/images/body-fat/female/45BFf.png');
        default: return require('../assets/images/body-fat/female/25BFf.png');
      }
    }
  } catch (error) {
    console.warn(`Body fat image not found for ${percentage}% ${gender}`);
    return null;
  }
};

export const BodyFatCarousel: React.FC<BodyFatCarouselProps> = ({
  bodyFatPercentages,
  gender,
  initialIndex,
  onIndexChange,
  onCopyToBar,
  inputValue // NOVÝ PROP
}) => {
  const flatListRef = useRef<FlatList>(null);
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const [isScrolling, setIsScrolling] = useState(false);

  // Initialize carousel position when component mounts
  useEffect(() => {
    if (flatListRef.current && bodyFatPercentages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: initialIndex,
          animated: false
        });
      }, 300);
    }
  }, []);

  // Update selected index when initialIndex changes from parent
  useEffect(() => {
    setSelectedIndex(initialIndex);
  }, [initialIndex]);

  // NOVÁ FUNKCE: Najít nejbližší body fat index (z původní verze)
  const findClosestBodyFatIndex = (value: number): number => {
    return bodyFatPercentages.reduce((prev, curr, index) => 
      Math.abs(curr - value) < Math.abs(bodyFatPercentages[prev] - value) ? index : prev
    , 0);
  };

  // NOVÝ USEEFFECT: Když se změní input hodnota, skoč na nejbližší obrázek
  useEffect(() => {
    if (inputValue && inputValue.trim() !== '') {
      const numericValue = parseFloat(inputValue);
      if (!isNaN(numericValue)) {
        const closestIndex = findClosestBodyFatIndex(numericValue);
        if (closestIndex !== selectedIndex) {
          setSelectedIndex(closestIndex);
          onIndexChange(closestIndex);
          
          // Animovaně posunout carousel na nejbližší obrázek
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({
              index: closestIndex,
              animated: true,
              viewPosition: 0.5
            });
          }, 100);
        }
      }
    }
  }, [inputValue]);

  // Calculate item layout for smooth scrolling - ZJEDNODUŠENO
  const getItemLayout = (_: any, index: number) => ({
    length: ITEM_WIDTH + ITEM_SPACING,
    offset: (ITEM_WIDTH + ITEM_SPACING) * index,
    index,
  });

  // Handle swipe/scroll end - ZJEDNODUŠENO
  const handleScrollEnd = (event: any) => {
    if (isScrolling) return;
    
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(contentOffsetX / (ITEM_WIDTH + ITEM_SPACING));
    
    if (newIndex >= 0 && newIndex < bodyFatPercentages.length && newIndex !== selectedIndex) {
      setSelectedIndex(newIndex);
      onIndexChange(newIndex);
    }
  };

  // ZRUŠENÁ VERZE handleItemPress - pouze swipe
  const handleItemPress = (index: number) => {
    // Funkce je zatím vypnutá - pouze swipe funguje
    return;
  };

  // Render individual carousel item
  const renderItem = ({ item, index }: { item: number; index: number }) => {
    const isSelected = index === selectedIndex;
    const imageSource = getBodyFatImage(item, gender);
    
    return (
      <TouchableOpacity
        style={[
          styles.carouselItem,
          {
            transform: [{ scale: isSelected ? 1.1 : 1 }],
            opacity: isSelected ? 1 : 0.7,
          }
        ]}
        onPress={() => handleItemPress(index)}
        activeOpacity={0.7}
      >
        {imageSource ? (
          <Image 
            source={imageSource} 
            style={styles.bodyFatImage}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.fallbackContainer}>
            <Text style={styles.fallbackText}>{item}%</Text>
          </View>
        )}
        <Text style={styles.carouselText}>{item}%</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.instruction}>Swipe to select body fat percentage</Text>
      <View style={styles.carouselContainer}>
        <FlatList
          ref={flatListRef}
          data={bodyFatPercentages}
          renderItem={renderItem}
          keyExtractor={(item) => item.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.flatListContent}
          snapToInterval={ITEM_WIDTH + ITEM_SPACING}
          snapToAlignment="center"
          decelerationRate="fast"
          onMomentumScrollEnd={handleScrollEnd}
          getItemLayout={getItemLayout}
          onScrollToIndexFailed={(info) => {
            console.warn('ScrollToIndexFailed:', info);
            // Jednoduchý fallback
            setTimeout(() => {
              if (flatListRef.current) {
                flatListRef.current.scrollToOffset({
                  offset: info.averageItemLength * info.index,
                  animated: true
                });
              }
            }, 100);
          }}
        />
      </View>
      <Text style={styles.copyInstruction}>Tap on an image to copy percentage to input field</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 0,
  },
  instruction: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666666',
    marginBottom: 0,
    marginTop: 0,
  },
  carouselContainer: {
    height: 280,
    position: 'relative',
    justifyContent: 'center',
  },
  flatListContent: {
    // OPRAVENÝ PADDING - přesné centrování
    paddingHorizontal: width / 2 - ITEM_WIDTH / 2,
  },
  carouselItem: {
    width: ITEM_WIDTH,
    height: 260,
    marginHorizontal: ITEM_SPACING / 2,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bodyFatImage: {
    width: 100,
    height: 200,
    marginBottom: 5,
  },
  fallbackContainer: {
    width: 100,
    height: 200,
    borderRadius: 8,
    backgroundColor: '#FFB347',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  fallbackText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  carouselText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333333',
  },
  copyInstruction: {
    textAlign: 'center',
    fontSize: 12,
    color: '#888888',
    marginTop: 10,
    fontStyle: 'italic',
  },
});