import React from 'react';
import CONFIG from '../config';

const RestaurantCard = ({ restaurant, onClick, isSelected }) => {
    const cuisine = CONFIG.getCuisineById(restaurant.cuisineType);
    const ratingStars = restaurant.rating ? '⭐'.repeat(Math.round(restaurant.rating)) : '';
    const priceLevel = restaurant.priceLevel ? '$'.repeat(restaurant.priceLevel) : '';
    const [imageError, setImageError] = React.useState(false);

    const isOpen = restaurant.isOpen;

    return (
        <div className={`restaurant-card ${isSelected ? 'highlighted' : ''}`} onClick={onClick}>
            {restaurant.photo && !imageError ? (
                <img
                    className="card-photo"
                    src={restaurant.photo}
                    alt={restaurant.name}
                    loading="lazy"
                    onError={() => setImageError(true)}
                />
            ) : (
                <div className="card-photo card-photo-placeholder">
                    <span style={{ fontSize: '3rem', opacity: 0.3 }}>{cuisine?.emoji || '🍽️'}</span>
                </div>
            )}

            <div className="card-content">
                <div className="card-header">
                    <h3 className="restaurant-name">{restaurant.name}</h3>
                    <span className="distance">{restaurant.distanceText}</span>
                </div>

                <div className="card-details">
                    {restaurant.rating && <div className="rating">{ratingStars} {restaurant.rating}</div>}
                    {isOpen !== null && (
                        <span className={`status ${isOpen ? 'open' : 'closed'}`}>
                            {isOpen ? '● Open' : '● Closed'}
                        </span>
                    )}
                    {priceLevel && <span className="price">{priceLevel}</span>}
                </div>

                {restaurant.address && <p className="address">{restaurant.address}</p>}

                {cuisine && (
                    <span
                        className="cuisine-tag"
                        style={{ background: `${cuisine.color}20`, color: cuisine.color }}
                    >
                        {cuisine.emoji} {cuisine.name}
                    </span>
                )}
            </div>
        </div>
    );
};

export default RestaurantCard;
